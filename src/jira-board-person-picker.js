// ==UserScript==
// @name         Jira Board Person Picker
// @namespace   urn://https://www.georgegillams.co.uk/api/greasemonkey/jira-board-person-picker
// @version      0.0.1
// @description  Add a spinning wheel to randomly select team members on Jira boards and track selections
// @author       You
// @include      *atlassian.net/jira*
// @include      */boards/*
// @exclude      none
// @icon         https://www.google.com/s2/favicons?sz=64&domain=atlassian.net
// @grant        none
// @license      MIT
// ==/UserScript==

const STORAGE_KEY = 'jira-board-selected-users';
const WHEEL_SIZE = 600; // diameter in pixels
const SPIN_DURATION = 2000; // milliseconds

let users = []; // Array of user objects: { id, name, identifier, element }
let selectedUserIds = []; // Array of user IDs that have been selected
let isSpinning = false;
let userIdCounter = 0; // Counter for generating unique IDs
let usersExtracted = false; // Flag to track if users have been extracted

// Format name to remove duplicates (e.g., "George GillamsGeorge Gillams" -> "George Gillams")
function formatUserName(name) {
  if (!name || typeof name !== 'string') return name;

  // Remove duplicate names (check if name is repeated)
  const trimmed = name.trim();
  const halfLength = Math.floor(trimmed.length / 2);

  // Check if first half equals second half
  if (halfLength > 0 && trimmed.length % 2 === 0) {
    const firstHalf = trimmed.substring(0, halfLength);
    const secondHalf = trimmed.substring(halfLength);

    // Normalize whitespace for comparison
    const normalize = (str) => str.replace(/\s+/g, ' ').trim();
    const firstNormalized = normalize(firstHalf);
    const secondNormalized = normalize(secondHalf);

    if (firstNormalized === secondNormalized && firstNormalized.length > 0) {
      return firstNormalized;
    }
  }

  // Also check for patterns like "NameName" (no space)
  const namePattern = /^(.+?)\1+$/;
  const match = trimmed.match(namePattern);
  if (match && match[1]) {
    return match[1].trim();
  }

  return trimmed;
}

// Generate unique ID for a user
function generateUserId() {
  return `user_${Date.now()}_${++userIdCounter}`;
}

// Load selected users from localStorage
function loadSelectedUsers() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      selectedUserIds = JSON.parse(stored);
      // Handle migration from old format (identifiers) to new format (IDs)
      if (
        selectedUserIds.length > 0 &&
        typeof selectedUserIds[0] === 'string' &&
        !selectedUserIds[0].startsWith('user_')
      ) {
        // Old format - convert identifiers to IDs by matching with users
        // This will be handled when users are loaded
        console.log('*** Migrating from old format');
      }
    }
  } catch (e) {
    console.error('Failed to load selected users:', e);
    selectedUserIds = [];
  }
  console.log('*** Already chosen people (IDs):', selectedUserIds);
}

// Save selected users to localStorage
function saveSelectedUsers() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedUserIds));
  } catch (e) {
    console.error('Failed to save selected users:', e);
  }
}

// Extract users from the Jira board
async function extractUsers() {
  console.log('*** Extracting users...');
  users = [];

  // Try to find overflow menu button (like "+12") and expand it first
  const overflowButton = Array.from(
    document.querySelectorAll('button, [role="button"], a[role="button"]'),
  ).find((btn) => {
    const text = btn.textContent.trim();
    // Match patterns like "+12", "+5", "Show 12 more", etc.
    return (
      /^\+\d+$/.test(text) ||
      /^\d+\s*more$/i.test(text) ||
      /show\s+\d+\s*more/i.test(text) ||
      (text.includes('more') && /\d+/.test(text))
    );
  });

  // Click overflow button if it exists to expand hidden filters
  if (overflowButton) {
    try {
      // Check if it's already expanded (might have different text when expanded)
      const isExpanded =
        overflowButton.getAttribute('aria-expanded') === 'true' ||
        overflowButton.classList.contains('expanded') ||
        overflowButton.getAttribute('data-expanded') === 'true';

      if (!isExpanded) {
        console.log('*** Clicking overflow button to expand filters');
        overflowButton.click();
        // Wait longer for filters to expand and menu items to render
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Wait for overflow menu items to actually appear
        let attempts = 0;
        while (attempts < 10) {
          const menuItems = document.querySelectorAll(
            'button[role="menuitemcheckbox"], [role="menuitemcheckbox"]',
          );
          if (menuItems.length > 0) {
            console.log('*** Overflow menu items loaded:', menuItems.length);
            // Wait a bit more to ensure all items are rendered
            await new Promise((resolve) => setTimeout(resolve, 500));
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 200));
          attempts++;
        }
      } else {
        // Menu already open, wait a bit to ensure items are loaded
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (e) {
      console.error('Failed to click overflow button:', e);
    }
  }

  // Extract user info from elements
  const userMap = new Map();

  // Strategy 1: Look for checkboxes with aria-label="Filter assignees by [Name]"
  const assigneeCheckboxes = Array.from(
    document.querySelectorAll(
      'input[type="checkbox"][aria-label*="Filter assignees by"]',
    ),
  );

  console.log('*** Found', assigneeCheckboxes.length, 'assignee checkboxes');
  assigneeCheckboxes.forEach((checkbox) => {
    const ariaLabel = checkbox.getAttribute('aria-label') || '';
    // Extract name from "Filter assignees by [Name]"
    const match = ariaLabel.match(/Filter assignees by (.+)$/i);
    if (match && match[1]) {
      let userName = match[1].trim();
      userName = formatUserName(userName); // Fix duplicates
      if (userName && userName.length > 0) {
        // Find the clickable element (label or parent container)
        const label = checkbox.closest('label') || checkbox.parentElement;
        const clickableElement = label || checkbox;

        const identifier = userName.toLowerCase().trim();
        if (!userMap.has(identifier)) {
          userMap.set(identifier, {
            id: generateUserId(),
            name: userName,
            element: clickableElement,
            identifier: identifier,
          });
        }
      }
    }
  });

  // Strategy 2: Look for hidden label spans with data-testid containing "avatar--label"
  const avatarLabels = Array.from(
    document.querySelectorAll('span[data-testid*="avatar--label"]'),
  );

  console.log('*** Found', avatarLabels.length, 'avatar label spans');
  avatarLabels.forEach((labelSpan) => {
    let userName = labelSpan.textContent.trim();
    userName = formatUserName(userName); // Fix duplicates
    if (userName && userName.length > 0 && userName.length < 50) {
      // Find the associated checkbox or clickable element
      const labelId = labelSpan.getAttribute('id');
      let clickableElement = null;

      // Try to find associated label or checkbox
      if (labelId) {
        const label =
          document.querySelector(`label[for="${labelId.replace('_', '')}"]`) ||
          document.querySelector(`label[aria-labelledby="${labelId}"]`);
        if (label) {
          clickableElement = label;
        } else {
          // Look for checkbox in the same container
          const container = labelSpan.closest('div');
          if (container) {
            const checkbox = container.querySelector('input[type="checkbox"]');
            if (checkbox) {
              const labelForCheckbox = checkbox.closest('label');
              clickableElement = labelForCheckbox || checkbox;
            }
          }
        }
      }

      // Fallback: find closest clickable parent
      if (!clickableElement) {
        clickableElement =
          labelSpan.closest('label') ||
          labelSpan.closest('button') ||
          labelSpan.closest('[role="button"]') ||
          labelSpan.parentElement;
      }

      const identifier = userName.toLowerCase().trim();
      if (!userMap.has(identifier) && clickableElement) {
        userMap.set(identifier, {
          id: generateUserId(),
          name: userName,
          element: clickableElement,
          identifier: identifier,
        });
      }
    }
  });

  // Strategy 3: Look for overflow menu items (buttons with role="menuitemcheckbox")
  const overflowMenuItems = Array.from(
    document.querySelectorAll(
      'button[role="menuitemcheckbox"], [role="menuitemcheckbox"]',
    ),
  );

  console.log('*** Found', overflowMenuItems.length, 'overflow menu items');
  overflowMenuItems.forEach((menuItem) => {
    // Look for the name in the div structure
    // The name appears in a div with classes, look for text content
    const nameDiv =
      menuItem.querySelector('div[data-item-title="true"]') ||
      Array.from(menuItem.querySelectorAll('div')).find((div) => {
        const text = div.textContent.trim();
        return (
          text &&
          text.length > 0 &&
          text.length < 50 &&
          /[a-zA-Z]/.test(text) &&
          !text.match(/^\d+$/) &&
          !text.includes('Filter')
        );
      });

    if (nameDiv) {
      let userName = nameDiv.textContent.trim();
      userName = formatUserName(userName); // Fix duplicates
      if (
        userName &&
        userName.length > 0 &&
        userName.length < 50 &&
        /[a-zA-Z]/.test(userName)
      ) {
        const identifier = userName.toLowerCase().trim();
        if (!userMap.has(identifier)) {
          userMap.set(identifier, {
            id: generateUserId(),
            name: userName,
            element: menuItem,
            identifier: identifier,
          });
        }
      }
    }
  });

  // Strategy 4: Fallback - look for any checkboxes with assignee-related attributes
  const allAssigneeInputs = Array.from(
    document.querySelectorAll(
      'input[type="checkbox"][name="assignee"], input[type="checkbox"][id^="assignee-"]',
    ),
  );

  console.log('*** Found', allAssigneeInputs.length, 'total assignee inputs');
  allAssigneeInputs.forEach((input) => {
    const ariaLabel = input.getAttribute('aria-label') || '';
    const id = input.getAttribute('id') || '';

    // Skip if already found
    if (ariaLabel.includes('Filter assignees by')) {
      return; // Already handled in Strategy 1
    }

    // Try to find name from label or nearby elements
    const label =
      input.closest('label') || document.querySelector(`label[for="${id}"]`);
    if (label) {
      // Look for hidden span with name
      const nameSpan = label.querySelector('span[hidden], span[id][hidden]');
      if (nameSpan) {
        let userName = nameSpan.textContent.trim();
        userName = formatUserName(userName); // Fix duplicates
        if (userName && userName.length > 0 && userName.length < 50) {
          const identifier = userName.toLowerCase().trim();
          if (!userMap.has(identifier)) {
            userMap.set(identifier, {
              id: generateUserId(),
              name: userName,
              element: label,
              identifier: identifier,
            });
          }
        }
      }
    }
  });

  // Remove non-person entries like "Unassigned"
  userMap.delete('unassigned');

  // Convert map to array and sort by name for consistency
  users = Array.from(userMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  console.log(
    '*** Available people:',
    users.map((u) => u.name),
  );
  console.log('*** Found', users.length, 'users total');

  // Wait a bit more before closing to ensure we got all users
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Close overflow menu after reading users
  if (overflowButton) {
    try {
      const isExpanded =
        overflowButton.getAttribute('aria-expanded') === 'true' ||
        overflowButton.classList.contains('expanded') ||
        overflowButton.getAttribute('data-expanded') === 'true';

      if (isExpanded) {
        console.log('*** Closing overflow menu after reading users');
        overflowButton.click();
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    } catch (e) {
      console.error('Failed to close overflow button:', e);
    }
  }

  if (users.length > 0) {
    usersExtracted = true;
  }
  console.log('*** Users extraction complete. Total:', users.length);
  return users.length > 0;
}

// Create floating action buttons
function createFloatingButtons() {
  // Check if buttons already exist
  if (document.getElementById('jira-person-picker-buttons')) {
    return;
  }

  const container = document.createElement('div');
  container.id = 'jira-person-picker-buttons';
  container.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  const chooseButton = document.createElement('button');
  chooseButton.textContent = 'Choose next person';
  chooseButton.className = 'jira-person-picker-choose-btn';
  chooseButton.style.cssText = `
    padding: 12px 20px;
    background-color: #0052cc;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: background-color 0.2s;
  `;

  chooseButton.addEventListener('mouseenter', function () {
    if (!isSpinning) {
      this.style.backgroundColor = '#0747a6';
    }
  });
  chooseButton.addEventListener('mouseleave', function () {
    if (!isSpinning) {
      this.style.backgroundColor = '#0052cc';
    }
  });

  chooseButton.addEventListener('click', () => {
    if (!isSpinning && users.length > 0) {
      const availableUsers = users.filter(
        (user) => !selectedUserIds.includes(user.id),
      );
      if (availableUsers.length > 0) {
        showWheel();
      } else {
        // All users selected, show message
        alert('All users have been selected! Click Reset to start over.');
      }
    }
  });

  const resetButton = document.createElement('button');
  resetButton.textContent = 'Reset';
  resetButton.className = 'jira-person-picker-reset-btn';
  resetButton.style.cssText = `
    padding: 12px 20px;
    background-color: #6b778c;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: background-color 0.2s;
  `;

  resetButton.addEventListener('mouseenter', function () {
    this.style.backgroundColor = '#5e6c84';
  });
  resetButton.addEventListener('mouseleave', function () {
    this.style.backgroundColor = '#6b778c';
  });

  resetButton.addEventListener('click', () => {
    console.log('*** Reset clicked - clearing selections');
    selectedUserIds = [];
    saveSelectedUsers();
    console.log('*** Already chosen people (after reset):', selectedUserIds);
    if (document.getElementById('jira-person-picker-wheel')) {
      hideWheel();
    }
    // Refresh the wheel if it's open
    if (document.getElementById('jira-person-picker-wheel')) {
      createWheel();
    }
  });

  container.appendChild(chooseButton);
  container.appendChild(resetButton);
  document.body.appendChild(container);
}

// Create spinning wheel UI
function createWheel() {
  // Remove existing wheel if present
  const existingWheel = document.getElementById('jira-person-picker-wheel');
  if (existingWheel) {
    existingWheel.remove();
  }

  const overlay = document.createElement('div');
  overlay.id = 'jira-person-picker-wheel';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 20000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && !isSpinning) {
      hideWheel();
    }
  });

  const wheelContainer = document.createElement('div');
  wheelContainer.style.cssText = `
    position: relative;
    width: ${WHEEL_SIZE}px;
    height: ${WHEEL_SIZE}px;
    background-color: white;
    border-radius: 50%;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    overflow: hidden;
  `;

  // Get available users (not yet selected)
  const availableUsers = users.filter(
    (user) => !selectedUserIds.includes(user.id),
  );

  if (availableUsers.length === 0) {
    // All users selected
    const message = document.createElement('div');
    message.textContent =
      'All users have been selected! Click Reset to start over.';
    message.style.cssText = `
      padding: 40px;
      text-align: center;
      color: #172b4d;
      font-size: 16px;
    `;
    wheelContainer.appendChild(message);
    overlay.appendChild(wheelContainer);
    document.body.appendChild(overlay);
    return;
  }

  // Wedge colours — vibrant palette, deterministic per user index
  const WEDGE_COLOURS = [
    '#0052cc',
    '#00875a',
    '#ff5630',
    '#6554c0',
    '#ff991f',
    '#00b8d9',
    '#36b37e',
    '#e91e63',
    '#8777d9',
    '#f06292',
    '#0065ff',
    '#00c7e6',
    '#ff7043',
    '#ab47bc',
    '#ffc400',
    '#43a047',
    '#ec407a',
    '#5c6bc0',
    '#26a69a',
    '#ef5350',
  ];

  // Create wheel segments
  const segmentAngleDeg = 360 / users.length;
  const radius = WHEEL_SIZE / 2;
  const centerX = WHEEL_SIZE / 2;
  const centerY = WHEEL_SIZE / 2;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', WHEEL_SIZE);
  svg.setAttribute('height', WHEEL_SIZE);
  svg.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: center;
  `;
  svg.id = 'jira-person-picker-wheel-svg';

  users.forEach((user, index) => {
    const startDeg = index * segmentAngleDeg;
    const endDeg = (index + 1) * segmentAngleDeg;

    // Convert to radians, offset by -90 so 0° points up
    const startRad = ((startDeg - 90) * Math.PI) / 180;
    const endRad = ((endDeg - 90) * Math.PI) / 180;

    const isSelected = selectedUserIds.includes(user.id);
    const colour = isSelected
      ? '#dfe1e6'
      : WEDGE_COLOURS[index % WEDGE_COLOURS.length];
    const textColour = 'white';
    const textOpacity = isSelected ? '0.5' : '1';

    // Segment path
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);
    const largeArc = segmentAngleDeg > 180 ? 1 : 0;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute(
      'd',
      `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`,
    );
    path.setAttribute('fill', colour);
    path.setAttribute('stroke', 'white');
    path.setAttribute('stroke-width', '1');
    svg.appendChild(path);

    // Text label — placed along the wedge, rotated to read outward from centre
    const midDeg = startDeg + segmentAngleDeg / 2;
    const midRad = ((midDeg - 90) * Math.PI) / 180;
    const textRadius = radius * 0.65;
    const textX = centerX + textRadius * Math.cos(midRad);
    const textY = centerY + textRadius * Math.sin(midRad);

    // Rotate 90° extra so text runs along the wedge (radially outward)
    // Flip if on the bottom half so text doesn't read upside-down
    let textRotDeg = midDeg - 90;
    const flipped = midDeg > 180 && midDeg <= 360;
    if (flipped) textRotDeg += 180;

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', textX);
    text.setAttribute('y', textY);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('fill', textColour);
    text.setAttribute('opacity', textOpacity);
    text.setAttribute('font-size', users.length > 12 ? '20' : '24');
    text.setAttribute('font-weight', '600');
    text.setAttribute(
      'font-family',
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    );
    text.setAttribute('transform', `rotate(${textRotDeg}, ${textX}, ${textY})`);

    const displayName =
      user.name.length > 14 ? user.name.substring(0, 12) + '…' : user.name;
    text.textContent = displayName;
    svg.appendChild(text);
  });

  wheelContainer.appendChild(svg);

  // Add pointer at top
  const pointer = document.createElement('div');
  pointer.style.cssText = `
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 15px solid transparent;
    border-right: 15px solid transparent;
    border-top: 30px solid #172b4d;
    z-index: 10;
  `;
  wheelContainer.appendChild(pointer);

  // Add close button
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    width: 32px;
    height: 32px;
    border: none;
    background-color: rgba(0, 0, 0, 0.1);
    color: #172b4d;
    border-radius: 50%;
    cursor: pointer;
    font-size: 24px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
  `;
  closeButton.addEventListener('mouseenter', function () {
    this.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
  });
  closeButton.addEventListener('mouseleave', function () {
    this.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
  });
  closeButton.addEventListener('click', (e) => {
    if (!isSpinning) {
      hideWheel();
    } else {
      e.stopPropagation();
    }
  });

  wheelContainer.appendChild(closeButton);

  // Prevent closing during spin
  wheelContainer.addEventListener('click', (e) => {
    if (isSpinning) {
      e.stopPropagation();
    }
  });

  overlay.appendChild(wheelContainer);
  document.body.appendChild(overlay);
}

// Show wheel and handle selection
function showWheel() {
  createWheel();

  const availableUsers = users.filter(
    (user) => !selectedUserIds.includes(user.id),
  );

  console.log(
    '*** Available people (not yet chosen):',
    availableUsers.map((u) => u.name),
  );
  console.log('*** Already chosen people (IDs):', selectedUserIds);
  console.log(
    '*** Already chosen people (names):',
    users.filter((u) => selectedUserIds.includes(u.id)).map((u) => u.name),
  );

  if (availableUsers.length === 0) {
    return;
  }

  // Select random user
  const randomIndex = Math.floor(Math.random() * availableUsers.length);
  const selectedUser = availableUsers[randomIndex];

  console.log('*** Current choice:', selectedUser.name);

  // Find index in full users array
  const selectedIndex = users.findIndex(
    (u) => u.identifier === selectedUser.identifier,
  );

  // Spin the wheel
  spinWheel(selectedIndex);
}

// Spin wheel animation
function spinWheel(targetIndex) {
  if (isSpinning) return;
  isSpinning = true;

  // Disable buttons during spin
  const chooseBtn = document.querySelector('.jira-person-picker-choose-btn');
  const resetBtn = document.querySelector('.jira-person-picker-reset-btn');
  if (chooseBtn) {
    chooseBtn.style.opacity = '0.5';
    chooseBtn.style.cursor = 'not-allowed';
  }
  if (resetBtn) {
    resetBtn.style.opacity = '0.5';
    resetBtn.style.cursor = 'not-allowed';
  }

  const svg = document.getElementById('jira-person-picker-wheel-svg');
  if (!svg) {
    isSpinning = false;
    if (chooseBtn) {
      chooseBtn.style.opacity = '1';
      chooseBtn.style.cursor = 'pointer';
    }
    if (resetBtn) {
      resetBtn.style.opacity = '1';
      resetBtn.style.cursor = 'pointer';
    }
    return;
  }

  const segmentAngle = 360 / users.length;
  // Calculate the center angle of the target segment
  // Segments start at 0 degrees (top), so segment 0 is from 0 to segmentAngle
  // We want the center of the segment to align with the pointer at top (0 degrees)
  const targetSegmentCenter = targetIndex * segmentAngle + segmentAngle / 2;

  // Calculate rotation: multiple full spins + rotation to center target segment at top
  // Since pointer is at top (0 degrees), we need to rotate so target center aligns with top
  // This means rotating by (360 - targetSegmentCenter) degrees
  const fullSpins = 5; // Number of full rotations
  const totalRotation = fullSpins * 360 + (360 - targetSegmentCenter);

  // Animate with easing
  const startTime = Date.now();
  const duration = SPIN_DURATION;

  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function: ease-out cubic
    const easeOutCubic = 1 - Math.pow(1 - progress, 3);
    const currentRotation = totalRotation * easeOutCubic;

    svg.style.transform = `rotate(${currentRotation}deg)`;

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Animation complete
      isSpinning = false;

      // Re-enable buttons
      const chooseBtn = document.querySelector(
        '.jira-person-picker-choose-btn',
      );
      const resetBtn = document.querySelector('.jira-person-picker-reset-btn');
      if (chooseBtn) {
        chooseBtn.style.opacity = '1';
        chooseBtn.style.cursor = 'pointer';
      }
      if (resetBtn) {
        resetBtn.style.opacity = '1';
        resetBtn.style.cursor = 'pointer';
      }

      // Add to selected users
      const selectedUser = users[targetIndex];
      console.log(
        '*** Selection confirmed:',
        selectedUser.name,
        '(ID:',
        selectedUser.id + ')',
      );
      if (!selectedUserIds.includes(selectedUser.id)) {
        selectedUserIds.push(selectedUser.id);
        saveSelectedUsers();
        console.log(
          '*** Updated already chosen people (IDs):',
          selectedUserIds,
        );
        console.log(
          '*** Updated already chosen people (names):',
          users
            .filter((u) => selectedUserIds.includes(u.id))
            .map((u) => u.name),
        );
      }

      // Activate filter for selected user
      activateUserFilter(selectedUser);

      // Close wheel after 2 seconds
      setTimeout(() => {
        hideWheel();
      }, 2000);
    }
  }

  animate();
}

// Hide wheel
function hideWheel() {
  if (isSpinning) return; // Don't allow closing during spin

  const wheel = document.getElementById('jira-person-picker-wheel');
  if (wheel) {
    wheel.remove();
  }
  isSpinning = false;

  // Re-enable buttons
  const chooseBtn = document.querySelector('.jira-person-picker-choose-btn');
  const resetBtn = document.querySelector('.jira-person-picker-reset-btn');
  if (chooseBtn) {
    chooseBtn.style.opacity = '1';
    chooseBtn.style.cursor = 'pointer';
  }
  if (resetBtn) {
    resetBtn.style.opacity = '1';
    resetBtn.style.cursor = 'pointer';
  }
}

// Find and get overflow button
function getOverflowButton() {
  return Array.from(
    document.querySelectorAll('button, [role="button"], a[role="button"]'),
  ).find((btn) => {
    const text = btn.textContent.trim();
    // Match patterns like "+12", "+5", "Show 12 more", etc.
    return (
      /^\+\d+$/.test(text) ||
      /^\d+\s*more$/i.test(text) ||
      /show\s+\d+\s*more/i.test(text) ||
      (text.includes('more') && /\d+/.test(text))
    );
  });
}

// Check if element is in overflow menu
function isInOverflowMenu(element) {
  // Check if element is inside a menu with role="menu" or menuitemcheckbox
  const menu = element.closest('[role="menu"], [role="menuitemcheckbox"]');
  return menu !== null;
}

// Find a visible filter checkbox for a user by name (re-queries the DOM)
function findVisibleFilterCheckbox(userName) {
  const checkboxes = document.querySelectorAll(
    'input[type="checkbox"][aria-label*="Filter assignees by"]',
  );
  for (const cb of checkboxes) {
    const label = cb.getAttribute('aria-label') || '';
    if (label.toLowerCase().includes(userName.toLowerCase())) {
      return cb;
    }
  }
  return null;
}

// Find an overflow menu item for a user by name (re-queries the DOM)
function findOverflowMenuItem(userName) {
  const items = document.querySelectorAll(
    'button[role="menuitemcheckbox"], [role="menuitemcheckbox"]',
  );
  for (const item of items) {
    const text = formatUserName(item.textContent.trim());
    if (text.toLowerCase().includes(userName.toLowerCase())) {
      return item;
    }
  }
  return null;
}

// Ensure overflow menu is open, returns true if it was opened
async function ensureOverflowOpen() {
  const overflowButton = getOverflowButton();
  if (!overflowButton) return false;

  const isExpanded =
    overflowButton.getAttribute('aria-expanded') === 'true' ||
    overflowButton.classList.contains('expanded') ||
    overflowButton.getAttribute('data-expanded') === 'true';

  if (!isExpanded) {
    overflowButton.click();
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return true;
}

// Ensure overflow menu is closed
async function ensureOverflowClosed() {
  const overflowButton = getOverflowButton();
  if (!overflowButton) return;

  const isExpanded =
    overflowButton.getAttribute('aria-expanded') === 'true' ||
    overflowButton.classList.contains('expanded') ||
    overflowButton.getAttribute('data-expanded') === 'true';

  if (isExpanded) {
    overflowButton.click();
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}

// Toggle a single user's filter. Returns true if toggled successfully.
async function toggleUserFilter(userName, shouldBeActive) {
  // First try visible checkbox
  const checkbox = findVisibleFilterCheckbox(userName);
  if (checkbox) {
    const isChecked = checkbox.checked;
    if (isChecked !== shouldBeActive) {
      console.log(
        '*** Clicking visible checkbox for:',
        userName,
        '(currently',
        isChecked,
        '-> want',
        shouldBeActive,
        ')',
      );
      checkbox.click();
      await new Promise((resolve) => setTimeout(resolve, 200));
    } else {
      console.log(
        '*** Visible checkbox for',
        userName,
        'already',
        isChecked ? 'active' : 'inactive',
      );
    }
    return true;
  }

  // Not a visible filter — try the overflow menu
  await ensureOverflowOpen();

  const menuItem = findOverflowMenuItem(userName);
  if (menuItem) {
    const isChecked = menuItem.getAttribute('aria-checked') === 'true';
    if (isChecked !== shouldBeActive) {
      console.log(
        '*** Clicking overflow item for:',
        userName,
        '(currently',
        isChecked,
        '-> want',
        shouldBeActive,
        ')',
      );
      menuItem.click();
      await new Promise((resolve) => setTimeout(resolve, 200));
    } else {
      console.log(
        '*** Overflow item for',
        userName,
        'already',
        isChecked ? 'active' : 'inactive',
      );
    }
    return true;
  }

  console.log('*** Could not find filter element for:', userName);
  return false;
}

// Activate filter for selected user (deactivate all others)
async function activateUserFilter(user) {
  console.log('*** Activating filter for:', user.name);

  // Step 1: Deactivate all visible checkboxes that are checked (except the target user)
  const allCheckboxes = document.querySelectorAll(
    'input[type="checkbox"][aria-label*="Filter assignees by"]',
  );
  for (const cb of allCheckboxes) {
    if (cb.checked) {
      const label = cb.getAttribute('aria-label') || '';
      if (!label.toLowerCase().includes(user.name.toLowerCase())) {
        console.log('*** Deactivating visible filter:', label);
        cb.click();
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
  }

  // Step 2: Open overflow menu and deactivate any checked items there (except target)
  await ensureOverflowOpen();

  const overflowItems = document.querySelectorAll(
    'button[role="menuitemcheckbox"], [role="menuitemcheckbox"]',
  );
  for (const item of overflowItems) {
    const isChecked = item.getAttribute('aria-checked') === 'true';
    if (isChecked) {
      const text = formatUserName(item.textContent.trim());
      if (!text.toLowerCase().includes(user.name.toLowerCase())) {
        console.log('*** Deactivating overflow filter:', text);
        item.click();
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
  }

  // Step 3: Close overflow menu
  await ensureOverflowClosed();

  // Step 4: Activate the selected user
  await toggleUserFilter(user.name, true);

  // Step 5: Ensure overflow is closed when done
  await ensureOverflowClosed();
}

// Migrate old format (identifiers) to new format (IDs)
function migrateSelectedUsers() {
  if (selectedUserIds.length === 0 || users.length === 0) return;

  // Check if we have old format (identifiers instead of IDs)
  const hasOldFormat = selectedUserIds.some(
    (id) => typeof id === 'string' && !id.startsWith('user_'),
  );

  if (hasOldFormat) {
    console.log(
      '*** Migrating from old format (identifiers) to new format (IDs)',
    );
    const migratedIds = [];

    selectedUserIds.forEach((oldId) => {
      if (typeof oldId === 'string' && !oldId.startsWith('user_')) {
        // Old format - find user by identifier
        const user = users.find((u) => u.identifier === oldId);
        if (user) {
          migratedIds.push(user.id);
        }
      } else {
        // Already in new format
        migratedIds.push(oldId);
      }
    });

    selectedUserIds = migratedIds;
    saveSelectedUsers();
    console.log('*** Migration complete. Selected IDs:', selectedUserIds);
  }
}

// Initialize script — called once after page load
async function initialize() {
  console.log('*** Initializing...');

  loadSelectedUsers();

  const usersFound = await extractUsers();

  if (usersFound) {
    migrateSelectedUsers();
    createFloatingButtons();

    const availableCount = users.filter(
      (u) => !selectedUserIds.includes(u.id),
    ).length;
    console.log(
      '*** Summary - Total people:',
      users.length,
      '| Available:',
      availableCount,
      '| Already chosen:',
      selectedUserIds.length,
    );
  } else {
    console.log('*** No users found. Reload the page to try again.');
  }
}

// Wait for page to load, then initialize once after 5 seconds
function doWork() {
  if (!window.location.href.includes('/boards/')) {
    return;
  }

  const startInit = () => {
    console.log('*** Waiting 3 seconds for page to load...');
    setTimeout(initialize, 3000);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startInit);
  } else {
    startInit();
  }
}

doWork();

// ==UserScript==
// @name         Copy Sainsburys giftcards
// @namespace   urn://https://www.georgegillams.co.uk/api/greasemonkey/sainsburys-gift-card
// @version      0.0.3
// @description  Add copy CTA to easily copy Sainsburys gift card number, PIN and amount
// @author       You
// @include     *vexrewards.com*
// @exclude     none
// @icon         https://www.google.com/s2/favicons?sz=64&domain=sainsburys.co.uk
// @grant        none
// @license MIT
// ==/UserScript==

function addCopyButton(containerElement, textToCopy, buttonText) {
  // Check if button already exists
  if (containerElement.querySelector('button.copy-all-button')) {
    return;
  }

  // Create copy button
  const copyButton = document.createElement('button');
  copyButton.className = 'copy-all-button';
  copyButton.textContent = buttonText;
  copyButton.style.cssText = `
            margin-left: 8px;
            padding: 4px 8px;
            background-color: #ed8b00;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        `;

  // Add hover effect
  copyButton.addEventListener('mouseenter', function () {
    this.style.backgroundColor = '#d17a00';
  });
  copyButton.addEventListener('mouseleave', function () {
    this.style.backgroundColor = '#ed8b00';
  });

  // Add click handler
  copyButton.addEventListener('click', async function () {
    try {
      await navigator.clipboard.writeText(textToCopy);
      const originalText = this.textContent;
      this.textContent = 'Copied!';
      this.style.backgroundColor = '#28a745';

      setTimeout(() => {
        this.textContent = originalText;
        this.style.backgroundColor = '#ed8b00';
      }, 1500);
    } catch (err) {
      console.error('Failed to copy: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);

      const originalText = this.textContent;
      this.textContent = 'Copied!';
      this.style.backgroundColor = '#28a745';

      setTimeout(() => {
        this.textContent = originalText;
        this.style.backgroundColor = '#ed8b00';
      }, 1500);
    }
  });

  // Insert button in the container
  containerElement.appendChild(copyButton);
}

function processCardTable() {
  const cardTable = document.getElementsByClassName('SiteDeliveryCardTable')[0];

  if (!cardTable) {
    console.log('Card table not found, retrying in 1 second...');
    setTimeout(processCardTable, 1000);
    return;
  }

  // Get the text content and parse it
  const tableText = cardTable.innerText;

  // Parse the text to extract card number and PIN
  const lines = tableText
    .split('\n')
    .flatMap((text) => text.split('\t'))
    .filter((line) => line.trim());

  let cardNumber = '';
  let pin = '';

  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === 'Card Number' && i + 1 < lines.length) {
      cardNumber = lines[i + 1];
    } else if (lines[i] === 'PIN' && i + 1 < lines.length) {
      pin = lines[i + 1];
    }
  }

  if (!cardNumber || !pin) {
    console.log('Could not find card number or PIN, retrying...');
    setTimeout(processCardTable, 1000);
    return;
  }

  // Extract amount from the page
  // Look for span with font-size:32pt and color:#ed8b00 (the amount display)
  const amountSpan = Array.from(document.querySelectorAll('span')).find(
    (span) => {
      const style = span.getAttribute('style') || '';
      return (
        style.includes('font-size:32pt') && style.includes('color:#ed8b00')
      );
    },
  );

  let amount = '';
  if (amountSpan) {
    amount = amountSpan.textContent.trim();
    // Remove £ symbol
    amount = amount.replace(/£/g, '');
    // Remove .00 if it ends with that
    if (amount.endsWith('.00')) {
      amount = amount.slice(0, -3);
    }
  }

  console.log('Found card number:', cardNumber);
  console.log('Found PIN:', pin);
  console.log('Found amount:', amount);

  // Remove first 8 digits from card number for copying
  const cardNumberToCopy =
    cardNumber.length > 8 ? cardNumber.substring(8) : cardNumber;

  // Format: NUMBER PIN (AMOUNT)
  const formattedText = `${cardNumberToCopy} ${pin}${
    amount ? ` (${amount})` : ''
  }`;

  // Find the container table cell for Card Number to add the button there
  const cardNumberCell = cardTable.querySelector('td');
  if (cardNumberCell) {
    addCopyButton(cardNumberCell, formattedText, 'Copy details');
  }
}

function doWork() {
  // Wait for page to load, then process the card table
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', processCardTable);
  } else {
    // Document already loaded
    processCardTable();
  }
}

doWork();

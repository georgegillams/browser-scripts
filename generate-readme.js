const fs = require('fs');

const DATA = require('./scripts.json');

const DATA_KEY_MAP = {
  id: 'Name',
  fileName: 'Code',
  greasyforkId: 'GreasyFork',
};

const CODE_TEXT = 'View code on GitHub';
const GREASY_FORK_TEXT = 'Install on GreasyFork';

function githubFileLink(fileName) {
  if (!fileName) {
    return null;
  }

  return `https://github.com/georgegillams/browser-scripts/blob/master/src/${fileName
    .split(' ')
    .join('%20')}`;
}

function greasyForkLink(greasyforkId) {
  if (!greasyforkId) {
    return null;
  }

  return `https://greasyfork.org/en/scripts/${greasyforkId}`;
}

function generateReadmeTableColumns(data, dataKeyMap) {
  const columns = [];
  const dataMapKeys = Object.keys(dataKeyMap);
  for (let columnI = 0; columnI < dataMapKeys.length; columnI += 1) {
    const columnName = dataKeyMap[dataMapKeys[columnI]];
    columns.push({ columnName, columnWidth: columnName.length });
  }
  // TODO Can we make this more generic?
  for (let dataI = 0; dataI < data.length; dataI += 1) {
    const nameTextWidth = data[dataI].id.length;
    columns[0].columnWidth = Math.max(columns[0].columnWidth, nameTextWidth);

    const codeTextWidth = CODE_TEXT.length;
    columns[1].columnWidth = Math.max(columns[1].columnWidth, codeTextWidth);

    const greasyTextWidth = GREASY_FORK_TEXT.length;
    columns[2].columnWidth = Math.max(columns[2].columnWidth, greasyTextWidth);
  }
  return columns;
}

function getChars(length, char) {
  let result = '';
  for (let lengthI = 0; lengthI < length; lengthI += 1) {
    result += char;
  }
  return result;
}

function pad(displayValue, actualContent, length) {
  let extraSpaces = length - 'null'.length;
  if (displayValue) {
    extraSpaces = length - displayValue.length;
  }
  return ` ${actualContent}${getChars(extraSpaces, ' ')} `;
}

function generateReadmeTable(data, dataKeyMap) {
  const columns = generateReadmeTableColumns(data, dataKeyMap);
  let result = '|';

  for (let columnI = 0; columnI < columns.length; columnI += 1) {
    const { columnName, columnWidth } = columns[columnI];
    result += ` ${pad(columnName, columnName, columnWidth)} |`;
  }
  result += '\n|';
  for (let columnI = 0; columnI < columns.length; columnI += 1) {
    const { columnWidth } = columns[columnI];
    result += ` ${getChars(columnWidth, '-')} |`;
  }

  for (let dataI = 0; dataI < data.length; dataI += 1) {
    result += '\n|';

    const nameColumnWidth = columns[0].columnWidth;
    const scriptName = data[dataI].id;
    result += ` ${pad(scriptName, scriptName, nameColumnWidth)} |`;

    const codeColumnWidth = columns[1].columnWidth;
    const codeFileName = data[dataI].fileName;
    result += ` ${pad(
      CODE_TEXT,
      `[${CODE_TEXT}](${githubFileLink(codeFileName)})`,
      codeColumnWidth,
    )} |`;

    const greasyColumnWidth = columns[2].columnWidth;
    const greasyId = data[dataI].greasyforkId;
    if (!greasyId) {
      result += ` ${pad('null', 'null', greasyColumnWidth)} |`;
    } else {
      result += ` ${pad(
        GREASY_FORK_TEXT,
        `[${GREASY_FORK_TEXT}](${greasyForkLink(greasyId)})`,
        greasyColumnWidth,
      )} |`;
    }
  }

  return result;
}

function fileContent(fileName) {
  return fs.readFileSync(fileName, 'utf8');
}

function writeFile(fileName, content) {
  fs.writeFileSync(fileName, content);
}

const readmeContent = fileContent('README.md');
const readmeContentSplit = readmeContent.split('## Scripts');
if (readmeContentSplit.length > 0) {
  const generatedReadme = `${
    readmeContentSplit[0]
  }## Scripts\n\n${generateReadmeTable(DATA, DATA_KEY_MAP)}`;
  writeFile('README.md', generatedReadme);
}

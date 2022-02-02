// ==UserScript==
// @name        Jira expand/collapse all
// @namespace   urn://https://www.georgegillams.co.uk/api/greasemonkey/jira_expand_collapse_all
// @include     *jira.*
// @exclude     none
// @version     0.0.2
// @description:en	Enables exxpanding/collapsing all sections by alt-clicking
// @grant    		none
// @description Enables exxpanding/collapsing all sections by alt-clicking
// ==/UserScript==

function expandAll() {
    document.getElementsByClassName('js-expander').forEach(element => {
        if (element.ariaExpanded !== 'true') {
            element.click();
        }
    })
}

function collapseAll() {
    document.getElementsByClassName('js-expander').forEach(element => {
        if (element.ariaExpanded === 'true') {
            element.click();
        }
    })
}

function getDivParentElement(element) {
    let result = element;
    while (result.tagName.toLowerCase() !== 'div') {
        result = result.parentElement;
    }
    return result;
}

function addEventListener() {
    document.addEventListener('click', (event) => {
        if (!event.altKey) {
            return;
        }

        const parentElement = getDivParentElement(event.target);
        if (parentElement.className.contains('js-expander')) {
            if (parentElement.ariaExpanded === "true") {
                expandAll();
            } else {
                collapseAll();
            }
        }
    })
}

function worker() {
    try {
        addEventListener();
    } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e);
    }
}

worker();

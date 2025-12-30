// saving the record categories and the order of categories are separate, to allow for re-ordering
var saveData;

var localStorageKey = "RECMANG";

function loadSaveData() {
    if (localStorage.getItem(localStorageKey)) {
        saveData = JSON.parse(localStorage.getItem(localStorageKey).substring(localStorageKey.length));
        return true;
    }
    return false;
}

function saveSaveData() {
    localStorage.setItem(localStorageKey, localStorageKey + JSON.stringify(saveData));
}

function newSaveData() {
    saveData = {
        records: {

        },
        catConfig: {

        },
        selected: ""
    };
    loadCategoriesFromWiki(exampleData);
}

function exportSaveData() {
    navigator.clipboard.writeText(localStorageKey + JSON.stringify(saveData));
}

function importSaveData() {
    let save = prompt("Insert the code here...");
    try {
        save = save.substring(localStorageKey.length);
        save = JSON.parse(save);

        saveData = save;
    }
    catch {
        alert("Wrong!");
    }
}
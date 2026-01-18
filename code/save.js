// saving the record categories and the order of categories are separate, to allow for re-ordering
var saveData;

function loadSaveData() {
    if (localStorage.getItem(config.localStorageKey)) {
        saveData = JSON.parse(localStorage.getItem(config.localStorageKey).substring(config.localStorageKey.length));
        return true;
    }
    return false;
}

function saveSaveData() {
    localStorage.setItem(config.localStorageKey, config.localStorageKey + JSON.stringify(saveData));
}

function newSaveData() {
    saveData = JSON.parse(hostedData.substring(config.localStorageKey.length));
    return true;

    saveData = {
        records: {

        },
        catConfig: {

        },
        selected: "",
        settings: {
            
        }
    };
    loadCategoriesFromWiki(exampleData);
}

function exportSaveData() {
    navigator.clipboard.writeText(config.localStorageKey + JSON.stringify(saveData));
    alert("copied to clipboard");
}

function importSaveData() {
    let save = prompt("Insert the code here...");
    try {
        save = save.substring(config.localStorageKey.length);
        save = JSON.parse(save);

        saveData = save;
    }
    catch {
        alert("Wrong!");
    }
}
var ui = {
    sectionTitle: document.getElementById("sectionTitle"),
    leftSide: document.getElementById("leftSide"),
    rightSide: document.getElementById("rightSide"),
    tabTitle: document.getElementById("tabTitle"),
    tabTitle2: document.getElementById("tabTitle2"),

    tableSearch: document.getElementById("tableSearch"),
    categoriesSearch: document.getElementById("categoriesSearch"),
};

function imageFromWiki(wikiImage) {
    // own function for loading images, which creates links instead of
    // trying to show images that discord doesnt allow anymore
    return '<a target="_blank" href="'
    + wikiImage.split("[")[1].split(" ")[0]
    + '">' + wikiImage.split("[")[1]?.split(" ")[1]?.split("]")[0] + '</a>';
}

function generateID() {
    return "" + Math.random().toString(16).slice(2);
}

function loadCategoryFromWiki(wikiContent) {
    // sub function for loadCategoriesFromWiki
    // loads the values of the player's records
    let wikiLines = wikiContent.split("\n");
    let content = [];
    let contentPush = [];
    let multiLiner = false;

    for (let line of wikiLines) {
        if ((line.includes("||") || line.substr(0, 2) == "| ") && !line.includes("|-")) {
            // separates the values
            let lineSplit = line.split("||");

            // removes first if it's 1., 2., 3. etc.
            if (lineSplit[0].trim().substr(-1) == "."
                && !lineSplit[0].includes("http")) lineSplit.shift(); // remove 1.


            for (let e in lineSplit) {
                lineSplit[e] = lineSplit[e].trim();
                if (lineSplit[e].includes("{{exp")) lineSplit[e] = lineSplit[e].split("{{exp|")[1].split("|")[0];
                if (lineSplit[e].includes("{{Exp")) lineSplit[e] = lineSplit[e].split("{{Exp|")[1].split("|")[0];
            }

            if (lineSplit.length <= 2
                && (lineSplit[0].trim() == "" || lineSplit[0].substr(0, 2) == "| ")) multiLiner = true;
            if (lineSplit[0].substr(0, 2) == "| ") lineSplit[0] = lineSplit[0].substr(2);

            if (!multiLiner) content.push(lineSplit);
            else if (lineSplit.length == 1) contentPush.push(lineSplit[0]);
            else contentPush.push(lineSplit[1]);
        }
        if (line.includes("|-")) {
            if (multiLiner) {
                content.push(contentPush);
                contentPush = [];
                multiLiner = false;
            }
        }
    }

    return content;
};

function loadCategoriesFromWiki(categoriesContent) {
    // takes the raw wiki data, and loads the records with their people
    // as well as the header (player name, level, etc.)

    // separates categories by headers
    categoriesContent = categoriesContent.split("\n=");
    let categoryName;
    let ID;
    let categoryContent;

    for (let cat of categoriesContent) {
        if (cat.includes("|-")) {
            // not a filler headline, has a table
            categoryName = cat.split("\n")[0].replaceAll("=", "").replaceAll("[", "").replaceAll("]", "");
            categoryName = categoryName.trim();

            ID = generateID();
            categoryContent = loadCategoryFromWiki(cat);

            saveData.records[ID] = categoryContent;
            if (saveData.catConfig[ID] == undefined) saveData.catConfig[ID] = {};
            saveData.catConfig[ID].name = categoryName;

            for (let cc of cat.split("\n")) {
                if (cc.includes("!!")) {
                    if (cc.includes("lace")) saveData.catConfig[ID].header = cc;
                    else saveData.catConfig[ID].header = " Place!!" + cc;
                }
            }
        }
    }
}

function createTable(name, content) {
    // turns data into a table, for rendering
    let counter = 1;
    let table = "{|\n" + saveData.catConfig[name].header;

    let cclass;

    for (let c of content){
        if (ui.tableSearch.value != "" && c.toString().toLowerCase().includes(ui.tableSearch.value.toLowerCase())) cclass = "class='golden' ";
        else cclass = "";

        table = table + "\n|-\n| " + cclass + counter + ".";
        for (let cc of c) {
            table = table + "||" + cc;
        }
        counter++;
    }
    return formatTableFromHTML(tableFromWiki(table),
    { tableClass: "tableClass", headerClass: "headerClass", rowClass: "rowClass" });
}

function showCategory(name) {
    // triggered when left side button clicked
    // changes right side to selected record category
    saveData.selected = name;

    renderRightSide();
    renderCategoriesList();
    saveSaveData();
}

function renderCategoriesList() {
    // renders the left side
    let render = "";

    // ft. search, to either search for the name, or its contents (needs to be fully spelled then)
    let filter = ui.categoriesSearch.value.toLowerCase().trim();
    let nameFilters;

    for (let ID in saveData.records) {
        if (filter != "") {
            nameFilters = [];
            for (n of saveData.records[ID]) {
                for (nn of n) {
                    nameFilters.push(nn.toLowerCase().trim());
                }
            }
        }

        if (filter == ""
            || saveData.catConfig[ID].name.toLowerCase().includes(filter)
            || nameFilters.includes(filter)
        ) {
            render = render + "<button class='listButton' onclick='showCategory(`" + ID + "`)' style='" + (saveData.selected == ID ? "background-color: rgb(255, 255, 180);" : "") + "'>" + saveData.catConfig[ID].name + "</button><br />";
        }
    }

    ui.leftSide.innerHTML = render;
}

function renderRightSide() {
    let cat = saveData.records[saveData.selected];
    if (cat == undefined) return false;

    ui.sectionTitle.innerHTML = saveData.catConfig[saveData.selected].name;
    ui.rightSide.innerHTML = createTable(saveData.selected, cat);// + "<hr style='clear: both;' /><br />" + saveData.selected;
}

function renderEverything() {
    ui.tabTitle.innerHTML = config.managerTitle;
    ui.tabTitle2.innerHTML = config.managerTitle;

    renderCategoriesList();
    renderRightSide();
}

function initializeManager() {
    // boots up the program
    ui.sectionTitle.innerHTML = "Select a category...";

    // load save, or create new
    if (!config.forceDataReset && loadSaveData()) {
        // loaded successfully
    }
    else {
        // create new
        newSaveData();
    }

    renderEverything();
}

initializeManager();
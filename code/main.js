////////////////////////////////////////////////
// variables
////////////////////////////////////////////////

var ui = {
    sectionTitle: document.getElementById("sectionTitle"),
    leftSide: document.getElementById("leftSide"),
    rightSide: document.getElementById("rightSide"),
    editorAreaCategory: document.getElementById("editorAreaCategory"),
    editorAreaRow: document.getElementById("editorAreaRow"),
    tabTitle: document.getElementById("tabTitle"),
    tabTitle2: document.getElementById("tabTitle2"),
    tabTitle3: document.getElementById("tabTitle3"),

    tableSearch: document.getElementById("tableSearch"),
    categoriesSearch: document.getElementById("categoriesSearch"),
    top10: document.getElementById("top10"),

    editorOnlySettings: document.getElementById("editorOnlySettings"),
    toggleUpsideDown: document.getElementById("toggleUpsideDown"),
};

var editor = {
    row: -1,
    category: ""
}

var catConfigs = [
    "name", "header", "sorter", "ascending", "preText", "tree"
];

////////////////////////////////////////////////
// core functions
////////////////////////////////////////////////

function generateID() {
    return "" + Math.random().toString(16).slice(2);
}

function convertToWikitext() {
    // CRAZY TODO PLAN?: generalize this (and other way around) into the wikitext-html converter, to have wikitext-js converts
    let WIKI = ``;
    let table;
    let tconfig;
    let rowCounter;
    let treeDepth;

    let curTree = undefined;
    let prevTree = [];

    for (let tID of Object.keys(saveData.records)) {
        table = saveData.records[tID];
        tconfig = saveData.catConfig[tID];

        //console.log(table);
        //console.log(tconfig);

        // header and pretext
        curTree = tconfig.tree != undefined ? tconfig.tree.split(".") : [];
        treeDepth = curTree.length;
        if (treeDepth > 0 && prevTree[0] != curTree[0]) WIKI = WIKI + `== ${curTree[0]} ==\n`;
        if (treeDepth > 1 && prevTree[1] != curTree[1]) WIKI = WIKI + `=== ${curTree[1]} ===\n`;
        if (treeDepth > 2 && prevTree[2] != curTree[2]) WIKI = WIKI + `==== ${curTree[2]} ====\n`;
        prevTree = curTree;

        WIKI = WIKI + `==${"=".repeat(treeDepth)} ${tconfig.name} ==${"=".repeat(treeDepth)}\n`;
        if (tconfig.preText) WIKI = WIKI + tconfig.preText + `\n`;
        WIKI = WIKI + `{| class='article-table'\n`;

        // table content 
        if (tconfig.header.substr(0, 2) == "! ") WIKI = WIKI + `${tconfig.header}\n`;
        else WIKI = WIKI + `! ${tconfig.header}\n`;

        rowCounter = 1;
        for (let row of table) {
            if (rowCounter > 10) continue;
            WIKI = WIKI + `|-\n`;
            for (let e in row) {
                if (e == 0) WIKI = WIKI + `| ${rowCounter}. || ${row[e]} `;
                else WIKI = WIKI + `|| ${row[e]} `;
            }
            
            WIKI = WIKI + `\n`;
            rowCounter++;
        }

        // end
        WIKI = WIKI + `|}\n\n`;
    }

    console.log(WIKI);
}

function sortableValue(v) {
    // takes care of various values to sort by, ie time, high numbers
    // this is purely internal and should not be returned to render
    if (v == undefined) return v;
    v = v.replaceAll(",", "");
    //v = v.replaceAll(".", "");

    // has link
    if (v.includes("http")) {
        v = v.trim();
        v = v.substr(v.indexOf(" ")).trim();
        if (v.substr(-1) == "]") v = v.substr(0, v.length - 1);
    }

    // time
    if (v.includes("min") || v.includes("hour")) {
        if (v.split(" ").length > 3) {
            v = v.split(" "); // 69 hours 30 mins -> 60,hours,30,mins
            let h = v[0] * 60;
            v = h + v[2];
        }
        else {
            v = v.split("h"); // still catches the hour
            let h = parseInt(v[0]) * 60;
            v = h + v[1];
        }

        return parseInt(v);
    }

    // normal notation numbers
    let normalNotation = "kMBTQqSsOND".split("");
    if (normalNotation.includes(v.trim().substr(-1))) {
        let index = normalNotation.indexOf(v.trim().substr(-1));
        let e = Math.pow(1000, index + 1); // +1 cuz index starts at 0 (K = 0)

        if (v.includes(".")) v = parseFloat(v);
        else v = parseInt(v);

        v = v * e;
        return v;
    }

    // return other
    return parseInt(v);
}

function toggleUpsideDown() {
    saveData.settings.upsideDown = ui.toggleUpsideDown.value == "on" ? true : false;
}

////////////////////////////////////////////////
// loading and converting
////////////////////////////////////////////////

function loadCategoryFromWiki(wikiContent) {
    // sub function for loadCategoriesFromWiki
    // loads the values of the player's records
    let wikiLines = wikiContent.split("\n");
    let content = [];
    let contentPush = [];
    let multiLiner = false;
    let lineSplit;
    let last;

    // go through the lines of a table (|, ||)
    for (let line of wikiLines) {
        if ((line.includes("||") || line.substr(0, 2) == "| ") && !line.includes("|-")) {
            // separates the values
            lineSplit = line.split("||");

            // removes first if it's 1., 2., 3. etc.
            if (lineSplit[0].trim().substr(-1) == "."
                && !lineSplit[0].includes("http")) lineSplit.shift(); // remove 1., 2., 3. (place)

            for (let e in lineSplit) {
                lineSplit[e] = lineSplit[e].trim();
                if (lineSplit[e].includes("{{exp")) lineSplit[e] = lineSplit[e].split("{{exp|")[1].split("|")[0];
                if (lineSplit[e].includes("{{Exp")) lineSplit[e] = lineSplit[e].split("{{Exp|")[1].split("|")[0];
            }

            // multiple elements in one line?
            if (lineSplit.length <= 2
                && (lineSplit[0].trim() == "" || lineSplit[0].substr(0, 2) == "| ")) multiLiner = true;
            if (lineSplit[0].substr(0, 2) == "| ") lineSplit[0] = lineSplit[0].substr(2);
            if (lineSplit[lineSplit.length - 1].trim() == "") {
                contentPush.push(...lineSplit);
                lineSplit = undefined;
                multiLiner = true;
            }
        }
        
        if (line.includes("http") && line.substr(0, 1) == "[") { // link
            if (lineSplit != undefined) {
                // add non-link content
                if (contentPush.length == 0) contentPush.push(...lineSplit);
                lineSplit = undefined;
            }

            // combine existing links and latest link
            if (contentPush.length == 0) last = 0;
            else last = 1;

            if (!line.includes("||") || line.split("[http").length > 2) contentPush[contentPush.length - last] = contentPush[contentPush.length - last] + line.substr(line.indexOf("[http"));

            multiLiner = true;
            lineSplit = undefined;
        }
        
        if (lineSplit != undefined) {
            if (!multiLiner) content.push(lineSplit);
            else if (lineSplit.length == 1) contentPush.push(lineSplit[0]);
            else contentPush.push(lineSplit[1]);

            lineSplit = undefined;
        }
        
        if (line.includes("|-")) {
            if (multiLiner) {
                // pushes multi line content when next line begins for sure
                content.push(contentPush);
                contentPush = [];
                multiLiner = false;
            }
        }
    }

    if (multiLiner && contentPush.length > 0) {
        content.push(contentPush);
    }

    return content;
};

function loadCategoriesFromWiki(categoriesContent) {
    // takes the raw wiki data, and loads the records with their people
    // as well as the header (player name, level, etc.)

    // separates categories by == categories ==
    categoriesContent = categoriesContent.split("\n=");
    let categoryName;
    let ID;
    let categoryContent;

    for (let cat of categoriesContent) {
        if (cat.includes("|-")) {
            // not a filler headline, has a table
            categoryName = cat.split("\n")[0].replaceAll("=", "").replaceAll("[", "").replaceAll("]", "");
            categoryName = categoryName.trim();

            // generate ID (used for saving) and load the contents (rows)
            ID = generateID();
            categoryContent = loadCategoryFromWiki(cat);

            saveData.records[ID] = categoryContent;
            if (saveData.catConfig[ID] == undefined) saveData.catConfig[ID] = {};
            saveData.catConfig[ID].name = categoryName;

            // headers
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

    let sorter = saveData.catConfig[name].sorter;
    let trimmedHeaders = saveData.catConfig[name].header.split("!!");
    for (let h in trimmedHeaders) {
        trimmedHeaders[h] = trimmedHeaders[h].trim().toLowerCase();
    }

    let cclass = "";
    let cclick = "";

    let prevValue = "";
    let prevCount = -1;

    for (let c of content) {
        // filter/highlight color (class) change
        if (config.editorMode && editor.row == counter) cclass = "class='editing' ";
        else if (ui.tableSearch.value != "" && c.toString().toLowerCase().includes(ui.tableSearch.value.toLowerCase())) cclass = "class='golden' ";
        else if (ui.categoriesSearch.value != "" && c.toString().toLowerCase().includes(ui.categoriesSearch.value.toLowerCase().trim())) cclass ="class='highlighted' ";
        else cclass = "";

        // clickable in editor mode
        if (config.editorMode) cclick = "onclick='clickRow(" + counter + ")' ";

        // ties
        if (sorter != undefined && prevValue == c[trimmedHeaders.indexOf(sorter) - 1]) {
            if (prevCount == -1) prevCount = counter - 1;
        }
        else {
            prevCount = -1;
            prevValue = "";
        }

        // add content
        table = table + "\n|-\n| " + cclass + cclick
            + (prevCount != -1 ? ("=" + prevCount) : counter) + ".";
        for (let cc of c) {
            table = table + "||" + cc;
        }

        prevValue = c[trimmedHeaders.indexOf(sorter) - 1]; // also for ties

        // used for 1./2./3. and top 10 limiter
        counter++;
        if (ui.top10.checked == true && counter > 10) break;
    }
    table = table + "\n|}";

    return formatTableFromHTML(tableFromWiki(table),
    { tableClass: "tableClass", headerClass: "headerClass", rowClass: "rowClass" });
}

function showCategory(name) {
    // triggered when left side button clicked
    // changes right side to selected record category
    saveData.selected = name;

    editCategory();
    renderRightSide();
    renderCategoriesList();
    saveSaveData();
}

////////////////////////////////////////////////
// edit row functions
////////////////////////////////////////////////

function clickRow(row) {
    // select this one
    if (!config.editorMode) return false;
    editor.row = row;

    // render cells for editing
    let render = "<h4>Edit row/submission:</h4>";

    for (let c in saveData.records[saveData.selected][row - 1]) {
        render = render + saveData.catConfig[saveData.selected].header.split("!!")[parseInt(c) + 1] // +1 to ignore place
        + "<input id='cell-" + c + "' onblur='editCell(" + c + ")' type='text' style='width: 75%; text-align: left;' value='"
        + saveData.records[saveData.selected][row - 1][c] + "'></input><br />";
    }

    render = render + "<button onclick='deleteRow()'>Delete row</button>";
    render = render + "<button onclick='deletePlayer(`" + saveData.records[saveData.selected][row - 1][saveData.catConfig[saveData.selected].header.split("!!").indexOf(" Player ") - 1] + "`)'>Delete all instances of player</button>";

    ui.editorAreaRow.innerHTML = render;

    // update relevant UI
    renderRightSide();
}

function deleteRow(selTable = saveData.selected, selRow = editor.row) {
    // deletes selected row
    if (!config.editorMode) return false;

    let newTable = [];
    for (let t in saveData.records[selTable]) {
        if (t != selRow - 1) {
            newTable.push(saveData.records[selTable][t]);
        }
    }

    saveData.records[selTable] = newTable;
    editor.row = -1;

    renderCategoriesList();
    renderRightSide();
}

function editCell(nr) {
    if (!config.editorMode) return false;

    saveData.records[saveData.selected][editor.row - 1][nr] = document.getElementById("cell-" + nr).value;
    
    sortTable();
    renderRightSide();
}

function deletePlayer(player) {
    if (!config.editorMode) return false;
    
    let table;
    for (let t in saveData.records) {
        table = saveData.records[t];
        for (let row in table) {
            if (table[row].includes(player)) deleteRow(t, parseInt(row) + 1);
        }
    }

    // render list, right side is done by deleteRow
    renderCategoriesList();
}

////////////////////////////////////////////////
// category editing functions
////////////////////////////////////////////////

function editCategory(category = saveData.selected) {
    if (!config.editorMode) return false;
    editor.category = category;

    let render = "<h4>Edit category:</h4>";

    // render editable config for the category
    for (let cfg of catConfigs) {
        render = render + cfg + ": "
        + "<input id='cfg-" + cfg
        + "' style='width: 75%; text-align: left;'"
        + "value='" + saveData.catConfig[category][cfg]
        + "' onblur='editCategoryConfig(`" + cfg + "`)'></input><br />";
    }

    // buttons
    render = render + "<button onclick='sortTable();'>Sort table</button>";
    render = render + "<button onclick='addTableRow();'>Add row</button>";
    render = render + "<button onclick='addTableRowEmpty();'>Add empty row</button>";

    ui.editorAreaCategory.innerHTML = render;
}

function editCategoryConfig(cfg) {
    let newValue = document.getElementById("cfg-" + cfg).value;
    if (newValue == "") return false;

    saveData.catConfig[editor.category][cfg] = newValue;

    if (cfg == "sorter") sortTable();
    renderRightSide();
}

function addTableRow() {
    let headers = saveData.catConfig[saveData.selected].header;
    let example = saveData.records[saveData.selected][0];
    if (example[example.length - 1].includes("[http")) {
        example[example.length - 1] = "images";
    }
    if (headers.includes("lace")) {
        headers = headers.split("lace")[1];
    }

    let input = prompt("separated by ,\n" + headers + "\n" + example);
    if (input == false || input == "" || input == undefined || !input.includes(",")) return false;
    input = input.split(",");
    if (input.length + 1 != saveData.catConfig[saveData.selected].header.split("!!").length) return false;

    saveData.records[saveData.selected].push(input);
    sortTable();
    renderEverything();
}

function addTableRowEmpty() {
    let emptyRow = [];
    for (let c = 0; c < saveData.catConfig[saveData.selected].header.split("!!").length - 1; c++) {
        emptyRow.push("");
    }

    saveData.records[saveData.selected].push(emptyRow);
    sortTable();
    renderEverything();
}

function sortTable(tableID = saveData.selected, sortByID = "auto") {
    let oldTable = saveData.records[tableID];
    let newTable = [];
    let pairs = []; // each pair is: [ID, value]
    // it sorts by value, and uses the ID to place them around

    if (sortByID == "auto" && saveData.catConfig[saveData.selected].sorter != undefined) {
        let headers = saveData.catConfig[saveData.selected].header.split("!!");
        for (head in headers) {
            headers[head] = headers[head].trim().toLowerCase();
        }
        sortByID = headers.indexOf(saveData.catConfig[saveData.selected].sorter.trim().toLowerCase()) - 1;
    }
    if (sortByID == undefined) {
        // usually the right one (0 = player, 1 = value)
        sortByID = 1; 
        saveData.catConfig[saveData.selected].sorter = 1;
    }

    // create pairs [ID, value]
    for (let p in oldTable) {
        pairs.push([p, sortableValue(oldTable[p][sortByID])]);
    }

    // sort
    let ascending = saveData.catConfig[saveData.selected].ascending;
    if (ascending == undefined) ascending = false;
    if (ascending == "true") ascending = true;
    if (saveData.settings.upsideDown == true) ascending = !ascending;

    for (let j = 0; j < pairs.length - 1; j++) {
        for (let i = j + 1; i < pairs.length; i++) {
            if (ascending == true ? pairs[i][1] < pairs[j][1] : pairs[j][1] < pairs[i][1]) {
                // swap
                if (ascending == true) {
                    let temp = [pairs[j][0], pairs[j][1]];
                    pairs[j] = [pairs[i][0], pairs[i][1]];
                    pairs[i] = temp;
                }
                else {
                    // descending (default)
                    let temp = [pairs[i][0], pairs[i][1]];
                    pairs[i] = [pairs[j][0], pairs[j][1]];
                    pairs[j] = temp;
                }
            }
        }
    }

    // generate new Table from the swapped pairs
    for (let n in oldTable) {
        newTable.push(oldTable[pairs[n][0]]);
    }

    saveData.records[tableID] = newTable;
    renderRightSide();
}

////////////////////////////////////////////////
// render functions
////////////////////////////////////////////////

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
    ui.rightSide.innerHTML = (saveData.catConfig[saveData.selected].preText ? saveData.catConfig[saveData.selected].preText : "")
    + createTable(saveData.selected, cat);
}

function renderEverything() {
    ui.tabTitle.innerHTML = config.managerTitle;
    ui.tabTitle2.innerHTML = config.managerTitle;
    ui.tabTitle3.innerHTML = config.managerTitle;

    renderCategoriesList();
    renderRightSide();
}

function initializeManager() {
    // boots up the program
    ui.sectionTitle.innerHTML = "Select a category...";
    ui.editorOnlySettings.style.display = config.editorMode ? "" : "none";

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
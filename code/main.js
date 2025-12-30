var ui = {
    sectionTitle: document.getElementById("sectionTitle"),
    leftSide: document.getElementById("leftSide"),
    rightSide: document.getElementById("rightSide"),
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
        if (line.includes("||") && !line.includes("|-")) {
            let lineSplit = line.split("||");
            if (lineSplit[0].includes(".") && !lineSplit[0].includes("http")) lineSplit.shift(); // remove 1.

            for (let e in lineSplit) {
                lineSplit[e] = lineSplit[e].trim();
                if (lineSplit[e].includes("{{exp")) lineSplit[e] = lineSplit[e].split("{{exp|")[1].split("|")[0];
                if (lineSplit[e].includes("{{Exp")) lineSplit[e] = lineSplit[e].split("{{Exp|")[1].split("|")[0];
            }

            console.log(lineSplit)
            if (lineSplit.length <= 2 && lineSplit[0].trim() == "") multiLiner = true;

            if (!multiLiner) content.push(lineSplit);
            else contentPush.push(lineSplit[1]);
        }
        if (line.includes("|-")) {
            if (multiLiner) {
            console.log(content, contentPush);
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
                    saveData.catConfig[ID].header = cc;
                }
            }
        }
    }
}

function renderCategoriesList() {
    // renders the left side
    let render = "";

    for (let ID in saveData.records) {
        render = render + "<button class='listButton' onclick='showCategory(`" + ID + "`)' style='" + (saveData.selected == ID ? "background-color: rgb(255, 255, 180);" : "") + "'>" + saveData.catConfig[ID].name + "</button><br />";
    }

    ui.leftSide.innerHTML = render;
}

function createTable(name, content) {
    // turns data into a table, for rendering
    let counter = 1;
    let table = "{|\n" + saveData.catConfig[name].header;
    for (let c of content){
        table = table + "\n|-\n|" + counter + ".";
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

function renderRightSide() {
    let cat = saveData.records[saveData.selected];
    if (cat == undefined) return false;

    ui.sectionTitle.innerHTML = saveData.catConfig[saveData.selected].name;
    ui.rightSide.innerHTML = createTable(saveData.selected, cat);// + "<hr style='clear: both;' /><br />" + saveData.selected;
}

function initializeManager() {
    // boots up the program
    ui.sectionTitle.innerHTML = "Select a category...";

    if (loadSaveData()) {
        // loaded successfully
    }
    else {
        // create new
    saveData.records["Biggest Star bomb"] = loadCategoryFromWiki(`
        {| class="article-table"
! Place !! Player !! From !! To !! Amount !! Evidence
|-
| 1. || AppleWOW || x4004 || x10164 || 6160 stars || [https://cdn.discordapp.com/attachments/437304129895923714/1182533447693107240/Screenshot_2023-12-06-19-50-36-899_com.scrap.clicker.android.jpg image 1] [https://cdn.discordapp.com/attachments/437304129895923714/1182533448078999673/Screenshot_2023-12-06-22-03-06-144_com.scrap.clicker.android.jpg image 2] [https://youtu.be/tOEEpt0eJF8?si=Kqw2qKjEGUasY9-h video]
|-
| 2. || IounnGunn || x1250 || x5750 || 4500 stars || [https://youtu.be/dyNPg8EBvOc video]
|-
| 3. || Karat || x8008 || x12345 || 4337 stars || [https://www.youtube.com/watch?v=fPB7zw5E4Rk video]
|-
| 4. || Pandarker || x8161 || 12180 || 4019 Stars || [https://media.discordapp.net/attachments/1245047415850139739/1390033408536875088/Screenshot_20250702_203853_Scrap_II.jpg?ex=6873f7fe&is=6872a67e&hm=606d4cd97f6c3ee9748d75403f8e3d612694eb2f699730730845867c5f1a60cf&=&format=webp&width=768&height=1662 Before] [https://media.discordapp.net/attachments/1245047415850139739/1390033408297533461/Screenshot_20250702_211002_Scrap_II.jpg?ex=6873f7fe&is=6872a67e&hm=1b0b292a412b936a8a9711da5f91d63ac1ab5435749546f5ff93caa6d019c401&=&format=webp&width=768&height=1662 After]
|-
| 5. || Shgabb || x10,000 || x13,750 ||  3,750 stars || [https://www.youtube.com/watch?v=k2jnYCIB3OA video]
|-
| 6. || СНЕЖА || x3500 || x7242 || 3742 stars || [https://cdn.discordapp.com/attachments/437304129895923714/1128039115116519474/1689013565209.jpg image 1] [https://cdn.discordapp.com/attachments/437304129895923714/1128039115351412776/1689013565197.jpg image 2] [https://cdn.discordapp.com/attachments/437304129895923714/1128039115682746399/1689013565186.jpg image 3] [https://cdn.discordapp.com/attachments/437304129895923714/1128039115963768852/1689013565176.jpg image 4]
|-
| 7. || Eduardo || x3013 || x6572 || 3509 stars || [https://cdn.discordapp.com/attachments/1245047415850139739/1406791190212251819/Screenshot_2025-08-17-19-08-18-353_com.scrap.clicker.android.jpg?ex=68aba8e4&is=68aa5764&hm=1fbb470779f1999c18656f1111d3590387e04891f79791933fe34b7b49aa3fd0& before] [https://cdn.discordapp.com/attachments/1245047415850139739/1406791190505848974/Screenshot_2025-08-17-19-45-05-566_com.scrap.clicker.android.jpg?ex=68aba8e4&is=68aa5764&hm=2b0e93c1065836a0e6e464d478510e5bb0edd296069779ee71950ef13a7891fd& after]
|-
| 8. || Fl4y || x7000 || x10297 || 3297 stars || [https://cdn.discordapp.com/attachments/1245047415850139739/1278975876003926080/Record_2024-07-02-16-58-27_11507c7166bc743a769f70bb2afe9664.mp4?ex=66d95a1b&is=66d8089b&hm=d29ea5b3a0a3b93a6b0613ae1bdfe76401b0a7984fcd93a031b25a69f54ba773& video]
|-
| 9. || CLS63AMG || x4050 || x7279 || 3229 stars || [https://www.youtube.com/watch?v=y_TERFLcvlY video]
|-
| 10. || Pener #PPL || x2000 || x5120 || 3120 stars || [https://youtu.be/6SqpHHRgvfI video, part 1] <br /> [https://youtu.be/F5ouddAqgus video, part 2]
|}
        `);
        newSaveData();
    }

    renderCategoriesList();
    renderRightSide();
}

initializeManager();
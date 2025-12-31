/*
written by Schrottii/Balnoom 2025
just a quick re-usable script for interactions between wikis and HTML^^ 
each function says which lang it takes the argument from, so if it says FromWiki it wants Wikitext and returns HTML, vice versa

functions:
tableFromWiki
tablesFromWiki
tableFromHTML
tablesFromHTML
imageFromWiki
imageFromHTML
*/

function tableFromWiki(wikiTable, separator) {
    let output = "";
    let trActive = false;
    wikiTable = wikiTable.match(/[^\r\n]+/g);
    //console.log(wikiTable);

    for (let line of wikiTable) {
        // beginning of table
        if (line.includes("{|")) {
            if (line.includes("class")) output = "<table class=" + line.split("class=")[1] + ">";         
            else output = "<table>";
            continue;
        } 
        else if (output == "") continue; // skip until table begins

        // end of table
        if (line.includes("|}")) {
            output = output + "</tr></table>";
            trActive = false;
            break;
        }

        // next line
        if (line == "|-") {
            output = output + (trActive ? "</tr><tr>" : "<tr>");
            continue;
        }

        // headers
        if (!line.includes("!!") && line.includes("!") && !line.includes("|")) {
            output = output + "<th>" + line.split("!")[1] + "</th>";
            trActive = true;
            continue;
        }
        if (line.includes("!!")) {
            let headers = line.substr(1).split("!!");
            for (let header of headers) {
                output = output + "<th>" + header + "</th>";
            }
            continue;
        }

        // lines / rows
        if (!line.includes("||") && line.includes("|")) {
            if (line.includes("class=")) output = output + "<td class=" + line.split("class=")[1].split(" ")[0] + ">" + line.split("class=")[1].split(" ")[1] + "</td>";
            else output = output + "<td>" + line.substr(1) + "</td>";
            continue;
        }
        if (line.includes("||")) {
            let rows = line.substr(1).split("||");
            //console.log(rows)

            for (let row of rows) {
                if (row.includes("[http")) {
                    row = imageFromWiki(row);
                }
                if (line.includes("onclick=") && line.includes("class=")) {
                    output = output + "<td onclick=" + line.split("onclick=")[1].split(" ")[0] + " class=" + line.split("class=")[1].split(" ")[0] + ">" + (row.includes("onclick=") ? row.split("onclick=")[1].split(" ")[1] : row) + "</td>";
                }
                else if (line.includes("onclick=")) output = output + "<td onclick=" + line.split("onclick=")[1].split(" ")[0] + ">" + (row.includes("onclick=") ? row.split("onclick=")[1].split(" ")[1] : row) + "</td>";
                else if (line.includes("class=")) output = output + "<td class=" + line.split("class=")[1].split(" ")[0] + ">" + (row.includes("class=") ? row.split("class=")[1].split(" ")[1] : row) + "</td>";
                else output = output + "<td>" + row + "</td>";
            }
            continue;
        }

        // images
        if (line.includes("[http")) {
            output = output + imageFromWiki(line);
            continue;
        }
    }

    return output;
}

function tablesFromWiki(wikiContent, separator = "\n") {
    let outputs = "";
    let tableComplete = false;
    let wikiLines = wikiContent.match(/[^\r\n]+/g);

    for (let wikiLine of wikiLines) {
        if (tableComplete) {
            if (wikiLine.includes("|}")) tableComplete = false;
        }
        else if (wikiLine.includes("{|")) {
            outputs = outputs + tableFromWiki(wikiContent, separator);
            wikiContent = wikiContent.substr(wikiContent.indexOf("|}") + 2);
            tableComplete = true;
        }
        else outputs = outputs + separator + wikiLine;
    }

    return outputs;
}

function tableFromHTML(htmlTable, separator = "\n") {
    let output = "";
    htmlTable = htmlTable.match(/[^\r<]+/g);

    let inRows = false;
    for (let line of htmlTable) {
        // start and end
        if (line.substr(0, 5) == "table") {
            output = output + "{|";
            continue;
        }

        if (line == "/table>") {
            output = output + separator + "|}";
            break;
        }

        // line break
        if (line.substr(0, 2) == "br") {
            output = output + "<br />" + line.split(">")[1];
            continue;
        }

        // table header
        if (line.substr(0, 3) == "th>") {
            output = output + separator + "!" + line.substr(3);
            continue;
        }

        // row
        if (line.substr(0, 3) == "tr>") {
            output = output + separator + "|-";
            inRows = false;
            continue;
        }

        // one
        if (line.substr(0, 3) == "td>") {
            if (inRows) output = output + "||" + line.substr(3);
            else output = output + separator + "|" + line.substr(3);
            inRows = true;
            continue;
        }

        // image
        if (line.substr(0, 3) == "img") {
            output = output + imageFromHTML(line);
        }
    }

    return output;
}

function tablesFromHTML(htmlContent, separator = "\n") {
    let outputs = "";
    let tableComplete = false;
    let htmlLines = htmlContent.match(/[^\r\n]+/g);

    for (let htmlLine of htmlLines) {
        if (tableComplete) {
            if (htmlLines.includes("</table>")) tableComplete = false;
        }
        else if (htmlLine.includes("<table")) {
            outputs = outputs + tableFromHTML(htmlContent, separator);
            htmlContent = htmlContent.substr(htmlContent.indexOf("</table>" + 8));
            tableComplete = true;
        }
        else outputs = outputs + separator + htmlLines;
    }

    return outputs;
}

function formatTableFromWiki(wikiTable, formatting) {
    // takes wiki table, adds classes to it, returns wiki table
    /*
        formatting = { }
        params:
        headerClass, rowClass
    */

    if (formatting.headerClass) wikiTable = wikiTable.replaceAll('!', '! class="' + formatting.headerClass + '"');
    if (formatting.rowClass) wikiTable = wikiTable.replaceAll('|', '| class="' + formatting.rowClass + '"');

    return wikiTable;
}

function formatTableFromHTML(htmlTable, formatting) {
    // takes html table, adds classes to it, returns html table
    /*
        formatting = { }
        params:
        table, header, row
    */

    if (formatting.tableClass) htmlTable = htmlTable.replace('<table>', '<table class="' + formatting.tableClass + '">');
    if (formatting.headerClass) htmlTable = htmlTable.replaceAll('<th>', '<th class="' + formatting.headerClass + '">');
    if (formatting.rowClass) htmlTable = htmlTable.replaceAll('<tr>', '<tr class="' + formatting.rowClass + '">');

    return htmlTable;
}

function imageFromHTML(htmlImage) {
    return "["
    + htmlImage.split('src="')[1].split('"')[0]
    + " " + htmlImage.split('alt="')[1].split('"')[0]
    + "]";
}
## What is Records Manager?
Application to manage game records that are written via Wikitext (wiki) tables, with tools to edit or update them faster and easier, and other neat things. 

## How to use
It can be used locally, with a dataset that is saved locally. Using it publicly for a game can be done by creating a fork, adjusting the config.js, keeping the updated data in wikidata.js and publishing it via GitHub pages or similar. 

## Contents 
Accessible for users:
- Displaying list of categories with easy and fast selection
- Rendering the table
- Search function for both categories and table content, with highlight
- Highlighting tool
- Top 10 limiter tool

Accessible for editors: 
- Tools to edit the category and its config
- Auto sort
- Automatic ranking (place)
- Handling various number formats, such as time or standard notation (k, M, B, T, ...)
- Tools to edit a row (its values) or delete it, or its player everywhere
- Export and import data

Config content: 
- Enabling and disabling editor mode
- Various stuff regarding the project's name
- Easy changing of the table design in style.css
- Data from wikidata.js is loaded automatically on boot, can be used to show it to public

## To do
- Export to wiki format: posupgs-esque format
- category trees
- Score counter for players (simple and points)
- Own records, saved locally
- alarm if a player gets added a second time to table (catconfig for that?)
- Removing scrap references (used for indev), creating fork for that, release everything
empsalary
=========

Employee salary rendering in node, data visualization with rickshaw, and some basic statistics processing.


To run the sample:
node app.js

Point your browser at:
http://localhost:3000

Once started, upload the two csv files in the following order:
employees_small.csv
salaries_small.csv

The reason for this is, a table will be loaded which displays employee data. This is what a user would care about.
The salaries are meant for aggregate statistics.
The way the demo is setup now, it will only accept two files. This is configurable within the app.js
in the dataprocessor initialization.
Base interface based on: 
https://github.com/blueimp/jQuery-File-Upload

I also used jade as the template engine.

Server side used the following modules, install with npm as follows:
npm install express
npm install formidable
npm install jQuery
npm install csv

Look in DataService and DataProcessor for more insight in to how this works.


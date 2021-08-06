"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exceljs_1 = require("exceljs");
let wb = new exceljs_1.Workbook();
wb.xlsx.readFile("./test.xlsx").then(function () {
    /*let sheet:Worksheet = wb.getWorksheet("Sheet1");
    let rowObject:Row = sheet.getRow(3);
    let cellObject:Cell = rowObject.getCell(2);
    console.log(cellObject.value);
    */
});

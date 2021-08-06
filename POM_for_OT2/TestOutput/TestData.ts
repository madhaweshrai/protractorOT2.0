import {Workbook, Row, Cell} from 'exceljs';

let wb:Workbook = new Workbook();
wb.xlsx.readFile("./test.xlsx").then(function(){
    /*let sheet:Worksheet = wb.getWorksheet("Sheet1");
    let rowObject:Row = sheet.getRow(3);
    let cellObject:Cell = rowObject.getCell(2);
    console.log(cellObject.value);
    */
})


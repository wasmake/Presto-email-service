const express = require('express');
const router = express.Router();
const axios = require('axios');

const mailer = require('nodemailer');
var fs = require('fs');

var handlebars = require('handlebars');

var xl = require('excel4node');

const options = {
        host: "mail.tracomex.com.mx",
        port: 25,
        secure: false, // use TLS
        tls: {
            rejectUnauthorized:false
        },
        auth: {
            user: "presto@tracomex.com.mx",
            pass: "r3pOr7Ead0r2s"
        }
    };

    router.post('/', async(req, res, next) => {
        let transporter = mailer.createTransport(options, null);
        axios.get('http://201.157.19.126:7070/presto/edge/api/rest/UserManagerService/login?presto_username=obarrera&presto_password=obarrera1', {withCredentials: true}).then(function (response) {
            // handle success
            var cooki = response.headers['set-cookie'][0].split(";")[0];
            console.log("Valid session... trying to fetch url...");
            axios.get('http://201.157.19.126:7070/presto/edge/api/rest/ReporteUnidadesEntregadasYTransmitidas_Mashup_DEV/Invoke?x-presto-resultFormat=json&FechaINICIAL=2020-03-16&FechaFINAL=2020-03-16', {
                headers: {
                    Cookie: cooki
                }
            }).then(function (answ) {
                console.log('Data received!');
                let data = answ.data.records;
                var wb = new xl.Workbook();
                var ws = wb.addWorksheet('Sheet 1');

                var style = wb.createStyle({
                    alignment: {
                        horizontal: 'center',
                        wrapText: true
                    },
                    font: {
                        color: '#000000',
                        size: 12,
                    },
                    numberFormat: '#,##0.00; (#,##0.00); -',
                });
                var header2 = wb.createStyle({
                    alignment: {
                        horizontal: 'center',
                        wrapText: true
                    },
                    font: {
                        color: '#000000',
                        bold: true,
                        size: 12,
                    },
                    fill: { // §18.8.20 fill (Fill)
                        type: 'pattern',
                        patternType: 'solid',
                        bgColor: '#eda737', // HTML style hex value. defaults to black
                        fgColor: '#eda737'
                    }
                });

                ws.column(2).setWidth(18);
                ws.row(2).setHeight(30);

                ws.cell(2,2)
                    .string("Unidades transmitidas")
                    .style(header2);

                ws.cell(3, 2)
                    .number(parseInt(data.transmitidas.records.record.transmitidas))
                    .style(style);

                wb.write('Excel2.xlsx');

            }).catch( function (error) {
                console.log(error);
            })
        })
            .catch(function (error) {
                // handle error
                console.log(error);
            });

        readHTMLFile(__dirname + ',,/../emails/reporte.html', function(err, html) {
            var template = handlebars.compile(html);
            let date = new Date();
            let year = date.getFullYear(); // 2019
            let day = date.getDate(); // 23
            let month = date.getMonth() + 1;
            let monthIndex = date.getMonth();
            const months = [
                'Enero',
                'Febrero',
                'Marzo',
                'Abril',
                'Mayo',
                'Junio',
                'Julio',
                'Augost',
                'Septiembre',
                'Octubre',
                'Noviembre',
                'Diciembre'
            ];
            let monthName = months[monthIndex];
            var replacements = {
                date: day + " de " + monthName + " del " + year
            };
            var htmlToSend = template(replacements);
            let data = {
                from: 'presto@tracomex.com.mx',
                to: 'andrewrora@gmail.com',
                subject: 'Reporte diario ' + day + " " +  monthName,
                html: htmlToSend,
                attachments: [
                    {   // file on disk as an attachment
                        filename: 'Reporte-' + day + "-" +  month +  "-" +  year + '.xlsx',
                        path: __dirname + '../../Excel2.xlsx' // stream this file
                    }
                ]
            };
            transporter.sendMail(data, (err, info) => {
                if(err) console.log('err', err);
                if(info) console.log("Email sent!")
            });
        });

        res.send('Success');
    });

var readHTMLFile = function(path, callback) {
    fs.readFile(path, {encoding: 'utf-8'}, function (err, html) {
        if (err) {
            throw err;
            callback(err);
        }
        else {
            callback(null, html);
        }
    });
};

module.exports = router;
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeOptions = exports.Package = exports.PackageToSend = exports.BlackBox = exports.Conf = void 0;
/* eslint-disable @typescript-eslint/camelcase */
var influxdb_client_1 = require("@influxdata/influxdb-client");
var dotenv_1 = __importDefault(require("dotenv"));
// Load the environment variables from a custom .env file
dotenv_1.default.config({ path: '/home/pi/6to4/.env' });
// Get the InfluxDB credentials from the environment variables
var influxDBCredentials = {
    token: process.env.LOCAL_TOKEN,
    org: process.env.LOCAL_ORG,
    bucket: process.env.BUCKET_NAME,
    url: process.env.LOCAL_URL,
};
exports.Conf = {
    /*InfluxDB credentials */
    BlackBox: {
        token: influxDBCredentials.token || '',
        org: influxDBCredentials.org || '',
        bucket: influxDBCredentials.bucket || '',
        url: influxDBCredentials.url || '',
    },
    hujiCloud: {
        token: '',
        org: '',
        bucket: '',
        url: '',
    },
};
exports.BlackBox = new influxdb_client_1.InfluxDB({
    url: exports.Conf.BlackBox.url,
    token: exports.Conf.BlackBox.token,
});
// export const Cloud = new InfluxDB({
//   url: Conf.hujiCloud.url,
//   token: Conf.hujiCloud.token,
// });
var PackageToSend = function (pkg, timeStamp, bufferNumber, exp_name) {
    return {
        Ready: new influxdb_client_1.Point(pkg.ipv6)
            .tag('Exp_Name', exp_name)
            .floatField('buffer_number', bufferNumber)
            .floatField('light', pkg.light)
            .floatField('battery_t', pkg.battery_t)
            .floatField('battery', pkg.battery)
            .floatField('bmp_press', pkg.bmp_press)
            .floatField('bmp_temp', pkg.bmp_temp)
            .floatField('hdc_temp', pkg.hdc_temp)
            .floatField('hdc_humidity', pkg.hdc_humidity)
            .floatField('tmp107_amb', pkg.tmp107_amb)
            .floatField('tmp107_obj', pkg.tmp107_obj)
            .intField('rssi', pkg.rssi)
            .timestamp(timeStamp),
    };
};
exports.PackageToSend = PackageToSend;
var Package = function (obj) {
    var Package = {
        ipv6: obj.ipv6,
        packet_number: obj.packet_number,
        light: obj.light,
        battery_t: obj.battery_t,
        battery: obj.battery,
        bmp_press: obj.bmp_press,
        bmp_temp: obj.bmp_temp,
        hdc_temp: obj.hdc_temp,
        hdc_humidity: obj.hdc_humidity,
        tmp107_amb: obj.tmp107_amb,
        tmp107_obj: obj.tmp107_obj,
        rssi: obj.rssi,
    };
    return {
        DB: Package,
        ADDR: String(obj.ipv6),
        NUM: parseFloat(obj.packet_number),
        TIME: new Date(),
    };
};
exports.Package = Package;
exports.writeOptions = {
    /* the maximum points/line to send in a single batch to InfluxDB server */
    batchSize: 1001,
    /* default tags to add to every point */
    defaultTags: { GW: 'RPI4' },
    /* maximum size of the retry buffer - it contains items that could not be sent for the first time */
    maxBufferLines: 2958500,
    /* the count of retries, the delays between retries follow an exponential backoff strategy if there is no Retry-After HTTP header */
    maxRetries: 20,
    /* maximum delay between retries in milliseconds */
    maxRetryDelay: 3600000,
    /* minimum delay between retries in milliseconds */
    minRetryDelay: 60000,
    /* a random value of up to retryJitter is added when scheduling next retry */
    retryJitter: 10000,
    // ... or you can customize what to do on write failures when using a writeFailed fn, see the API docs for details
    writeFailed: function (error, lines, failedAttempts) {
        console.error(error);
        // if (failedAttempts > 5) {
        //   try {
        //     let array = fs.readFileSync('data.txt').toString().split("\n");
        //     const reWriteApi = client.getWriteApi(org, bucket, 's', writeOptions)
        //     reWriteApi.writeRecords(array);
        //   } catch (e) {
        //     console.error(e)
        //     // console.log('\nFinished ERROR')
        //   }
        // }
    },
    writeSuccess: function (lines) {
        console.log(lines);
    },
};

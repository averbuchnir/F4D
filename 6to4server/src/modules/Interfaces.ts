// import { Point } from '@influxdata/influxdb-client';
export interface PKG {
  timeReceived: Date;
  lastPackage: PackageObj;
  lastPackageID: number;
  isFirstPackage: boolean;
}

export interface PkgElement {
  [ipv6: string]: PKG;
}

export interface PackageObj {
  ipv6: string;
  packet_number: number;
  light: number;
  battery_t: number;
  battery: number;
  bmp_press: number;
  bmp_temp: number;
  hdc_temp: number;
  hdc_humidity: number;
  tmp107_amb: number;
  tmp107_obj: number;
  rssi: any;
}


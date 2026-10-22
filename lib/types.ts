export type PropertyMapping={id:string;name:string;listingNames:string[]};
export type Reservation={reservationCode?:string;sourceRow?:number;airbnbListing?:string;propertyId?:string;id:string;property:string;statementMonth:string;guest:string;checkin:string;checkout:string;payout:number|null;split:number|null;payoutType:'castle'|'split'|'owner';currency:string;arrival:string;sourceBundleAmount:number|null;sourceBundleId:string;bundleId:string;notes:string;locks:string[]};
export type Bundle={locks?:string[];id:string;paymentDate:string;arrival:string;depositDate:string;actual:number|null;sourceAmount:number|null;currency:string;reference:string;notes:string};
export type Member={email:string;role:'admin'|'accountant'|'viewer';userId?:string};
export type Audit={at:string;actor:string;action:string;details:string};
export type ImportRun={id:string;at:string;actor:string;file:string;added:number;updated:number;skipped:number;failed:number;conflicts:number};
export type State={source?:{kind:'google-sheets';readOnly:boolean;timeZone?:string;readAt:string;warnings:string[]};properties?:PropertyMapping[];reservations:Reservation[];bundles:Bundle[];members:Member[];tolerance:number;audit:Audit[];imports:ImportRun[]};
export type Filters={month?:string;property?:string;payoutType?:string;from?:string;to?:string};

'use strict';
// Name hashing for externally reported item identifiers, not save integrity.
function joaat(value){let h=0;for(const byte of Buffer.from(value.toLowerCase())){h=(h+byte)>>>0;h=(h+(h<<10))>>>0;h^=h>>>6;}h=(h+(h<<3))>>>0;h^=h>>>11;return(h+(h<<15))>>>0;}
module.exports={joaat};

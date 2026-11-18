// Render the actual component with synthetic data for visual checks. No network or account actions.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),React=require('react');const {renderToStaticMarkup}=require('react-dom/server');
const root=path.resolve(__dirname,'../..');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true,jsx:ts.JsxEmit.ReactJSX}}).outputText,f);
const parcel={id:'sample-parcel',senderId:'sample-owner',senderName:'Sample sender',senderVerified:true,senderRating:null,fromCountry:'KE',fromCity:'Nairobi',toCountry:'FR',toCity:'Paris',neededBy:'2027-01-20',weightKg:3,categories:['documents'],description:'Documents in an envelope',budgetUsd:25,createdAt:new Date().toISOString()};
const trip={id:'sample-trip',travelerId:'sample-traveller',travelerName:'Alex Traveller',travelerVerified:true,travelerRating:4.8,tripsCompleted:6,fromCountry:'KE',fromCity:'Nairobi',toCountry:'FR',toCity:'Paris',departDate:'2027-01-18',remainingKg:10,spaceKg:10,bookedKg:0,pricePerKg:7,categoriesAccepted:['documents'],notes:'Meet in Nairobi before departure.',createdAt:new Date().toISOString()};
let index=0;const states=[[{kind:'parcel',id:parcel.id,status:'open',date:parcel.neededBy,confirmedAt:null,title:'Nairobi → Paris',parcel}],[trip],[],[],'','',false,false];
const original=Module._load;
Module._load=function(request,parent,isMain){
 if(request==='react'&&parent?.filename===path.join(root,'app/dashboard/listings/page.tsx'))return {...React,useState:initial=>[states[index++]??initial,()=>{}]};
 if(request==='next/navigation')return {useRouter:()=>({push(){},replace(){}}),useSearchParams:()=>new URLSearchParams('kind=parcel&id=sample-parcel&posted=1')};
 if(request==='next/link')return {__esModule:true,default:props=>React.createElement('a',props)};
 if(request==='@/lib/auth')return {useSession:()=>({session:{userId:'sample-owner'},loading:false})};
 if(request==='@/lib/useContactGate')return {useContactGate:()=>async()=>true};
 if(request==='@/lib/db'||request==='@/lib/supabase')return {};
 if(request==='@/lib/i18n')return {useLang:()=>({lang:'en'}),useT:()=>require(path.join(root,'lib/locales/en.ts')).en};
 if(request.startsWith('@/'))return original.call(this,path.join(root,request.slice(2)),parent,isMain);
 return original.call(this,request,parent,isMain);
};
const Page=require(path.join(root,'app/dashboard/listings/page.tsx')).default;
const css=fs.readdirSync(path.join(root,'.next/static/css')).map(f=>`<link rel="stylesheet" href="/_next/static/css/${f}">`).join('');
const output=process.argv[2];if(!output)throw new Error('Provide a temporary output directory');fs.mkdirSync(output,{recursive:true});
for(const [name,target] of [['_next',path.join(root,'.next')],['fonts',path.join(root,'public/fonts')]])if(!fs.existsSync(path.join(output,name)))fs.symlinkSync(target,path.join(output,name));
fs.writeFileSync(path.join(output,'index.html'),`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${css}<title>Matching preview — sample data</title></head><body><div class="bg-forest px-4 py-2 text-center text-sm text-white">Design check · sample data</div>${renderToStaticMarkup(React.createElement(Page))}</body></html>`);

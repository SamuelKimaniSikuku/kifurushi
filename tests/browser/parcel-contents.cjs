// Real app pages with sample API responses; never writes to the live service.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
const base=process.env.KIFURUSHI_TEST_BASE || 'http://127.0.0.1:3119';
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
 page.setDefaultTimeout(12000);const errors=[],writes=[];page.on('pageerror',e=>errors.push(e.message));
 const uid='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222',tid='33333333-3333-4333-8333-333333333333',pid='44444444-4444-4444-8444-444444444444';
 const user={id:uid,aud:'authenticated',role:'authenticated',email:'contents-test@example.invalid',user_metadata:{full_name:'Sample Sender'},app_metadata:{provider:'email'}};
 const token=[{alg:'HS256',typ:'JWT'},{sub:uid,role:'authenticated',exp:Math.floor(Date.now()/1000)+3600},'test-only'].map(v=>Buffer.from(typeof v==='string'?v:JSON.stringify(v)).toString('base64url')).join('.');
 const session={access_token:token,refresh_token:'test-only',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user};
 await context.addInitScript(({session})=>{localStorage.setItem('sb-bltaaidjhpkmwnsprenu-auth-token',JSON.stringify(session));localStorage.setItem('kifurushi.lang','en');},{session});
 const future=new Date(Date.now()+14*86400000).toISOString().slice(0,10);
 const trip={id:tid,traveler_id:other,from_country:'FR',from_city:'Paris',to_country:'KE',to_city:'Nairobi',depart_date:future,space_kg:2,remaining_kg:2,booked_kg:0,price_per_kg:10,categories:['certificates'],created_at:new Date().toISOString(),profile:{id:other,full_name:'Sample Traveller',id_verified:true,rating:null,deliveries_completed:0}};
 let failSave=false,showTrip=false,showParcel=false;
 const parcel={id:pid,sender_id:other,from_country:'FR',from_city:'Paris',to_country:'KE',to_city:'Nairobi',needed_by:future,weight_kg:0.05,description:'One birth certificate in an envelope',item_count:1,package_type:'envelope',weight_kind:'measured',budget_usd:10,categories:['certificates'],created_at:new Date().toISOString(),profile:{id:other,full_name:'Sample Sender',id_verified:false,rating:null}};
 await page.route('https://bltaaidjhpkmwnsprenu.supabase.co/**',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname;let data=[];
  if(path==='/auth/v1/token')data=session;
  else if(path==='/auth/v1/user')data=user;
  else if(path==='/rest/v1/memberships')data={status:'active',plan:'yearly',provider:'trial',created_at:new Date().toISOString(),current_period_end:'infinity'};
  else if(path==='/rest/v1/profiles')data={id:uid,full_name:'Sample Sender'};
  else if(path==='/rest/v1/rpc/save_parcel'){
   if(failSave)return route.fulfill({status:500,contentType:'application/json',body:JSON.stringify({message:'Temporary save failure'})});
   writes.push({type:'parcel',body:req.postDataJSON()});data=pid;
  }
  else if(path==='/rest/v1/trips' && req.method()==='POST'){writes.push({type:'trip',body:req.postDataJSON()});data={id:tid};}
  else if(path==='/rest/v1/trips')data=showTrip?[trip]:[];
  else if(path==='/rest/v1/parcels')data=showParcel?[parcel]:[];
  else if(path==='/rest/v1/matches' && req.method()==='POST'){writes.push({type:'match',body:req.postDataJSON()});data={id:'match'};}
  else if(path.startsWith('/rest/v1/rpc/'))data=false;
  else if(path==='/rest/v1/verifications'||path==='/rest/v1/contact_details')data=null;
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.route('**/*',route=>{
  const host=new URL(route.request().url()).hostname;
  return host===new URL(base).hostname||host==='bltaaidjhpkmwnsprenu.supabase.co'?route.fallback():route.abort();
 });
 await page.goto(base+'/post/parcel');await page.locator('#fromCountry').waitFor();
 await page.locator('#fromCountry').selectOption('FR');await page.locator('#fromCity').fill('Paris');await page.locator('#toCountry').selectOption('KE');await page.locator('#toCity').fill('Nairobi');await page.locator('#neededBy').fill(future);
 assert.equal(await page.locator('#weightKg').inputValue(),'');assert.equal(await page.locator('#budgetUsd').inputValue(),'');
 await page.getByLabel('Weight unit',{exact:true}).selectOption('g');await page.locator('#weightKg').fill('50');await page.getByLabel('How was the weight found?').selectOption('measured');
 await page.locator('#budgetUsd').fill('10');await page.locator('#description').fill('One birth certificate in an envelope');await page.locator('#packageType').selectOption('envelope');await page.locator('#itemCount').fill('1');
 await page.locator('button[type=submit]').click();await page.getByText('Choose at least one item type.',{exact:true}).waitFor();assert.equal(writes.length,0);
 await page.getByRole('button',{name:'📜 Certificates',exact:true}).click();
 await page.locator('#parcel-declaration input[type=checkbox]').check();
 await page.screenshot({path:'/private/tmp/kifurushi-parcel-mobile.png',fullPage:true});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 failSave=true;await page.locator('button[type=submit]').click();await page.getByText('Temporary save failure',{exact:true}).waitFor();assert.equal(await page.locator('#description').inputValue(),'One birth certificate in an envelope');
 failSave=false;await page.locator('button[type=submit]').click();await page.waitForURL('**/dashboard/listings?**');
 const saved=writes.find(x=>x.type==='parcel').body;assert.equal(saved.p_parcel.weightKg,0.05);assert.equal(saved.p_parcel.itemCount,1);assert.equal(saved.p_parcel.packageType,'envelope');assert.equal(saved.p_parcel.weightKind,'measured');assert.deepEqual(saved.p_parcel.categories,['certificates']);assert.deepEqual(saved.p_photo_paths,[]);
 await page.goto(base+'/post/trip');await page.locator('#cats').waitFor();assert.equal(await page.locator('#cats button[aria-pressed=true]').count(),0);
 await page.getByRole('button',{name:'🔒 Certificates only',exact:true}).click();assert.equal(await page.locator('#cats button[aria-pressed=true]').count(),1);
 await page.locator('#fromCountry').selectOption('FR');await page.locator('#fromCity').fill('Paris');await page.locator('#toCountry').selectOption('KE');await page.locator('#toCity').fill('Nairobi');await page.locator('#departDate').fill(future);
 await page.setViewportSize({width:1440,height:1000});await page.locator('#cats').scrollIntoViewIfNeeded();await page.screenshot({path:'/private/tmp/kifurushi-trip-desktop.png',animations:'disabled'});
 await page.locator('button[type=submit]').click();await page.waitForURL('**/dashboard/listings?**');assert.deepEqual(writes.find(x=>x.type==='trip').body.categories,['certificates']);
 // Direct request explicitly rejects mixed goods before creating a parcel.
 showTrip=true;await page.goto(base+'/trips');await page.getByRole('button',{name:'Request this traveller',exact:true}).click();
 const dialog=page.getByRole('dialog');await dialog.waitFor();await dialog.getByRole('button',{name:'📜 Certificates',exact:true}).click();await dialog.getByRole('button',{name:'👕 Clothing',exact:true}).click();
 await dialog.getByText(/These items do not fit/).waitFor();assert(await dialog.locator('button[type=submit]').isDisabled());
 await dialog.getByRole('button',{name:'👕 Clothing',exact:true}).click();assert(!await dialog.locator('button[type=submit]').isDisabled());
 await page.setViewportSize({width:320,height:568});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'/private/tmp/kifurushi-certificates-request-mobile.png',fullPage:true});
 // Public card keeps content primary, uses grams, and does not display document photos.
 showParcel=true;await page.goto(base+'/parcels');await page.getByRole('heading',{name:parcel.description,exact:true}).waitFor();await page.getByText('50 g',{exact:true}).waitFor();await page.getByText('Envelope',{exact:true}).waitFor();await page.screenshot({path:'/private/tmp/kifurushi-parcel-card.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('PASS: parcel posting, required category, 50 g conversion, private optional photos, failed-save draft, traveller preset, mixed request rejection and small-screen cards; all writes mocked.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});

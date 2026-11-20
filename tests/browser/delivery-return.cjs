// Exercise the real production build with intercepted sample API responses only.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
const base=process.env.KIFURUSHI_TEST_BASE || 'http://127.0.0.1:3119';
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try {
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
 const errors=[],writes=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(12000);
 const uid='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222',mid='33333333-3333-4333-8333-333333333333',pid='44444444-4444-4444-8444-444444444444';
 const user={id:uid,aud:'authenticated',role:'authenticated',email:'return-test@example.invalid',user_metadata:{full_name:'Sample Sender'},app_metadata:{provider:'email'}};
 const token=[{alg:'HS256',typ:'JWT'},{sub:uid,role:'authenticated',exp:Math.floor(Date.now()/1000)+3600},'test-only'].map(v=>Buffer.from(typeof v==='string'?v:JSON.stringify(v)).toString('base64url')).join('.');
 const session={access_token:token,refresh_token:'test-only',expires_in:3600,token_type:'bearer',user};
 let status='accepted',role='sender',held=false,outcome=null,inspections=[],messages=[],failMessage=false,missing=false,otpRedirect=null;
 await page.route('https://bltaaidjhpkmwnsprenu.supabase.co/**',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname;let data=[];
  const rejected=message=>route.fulfill({status:403,contentType:'application/json',body:JSON.stringify({message})});
  if(path==='/auth/v1/token')data=session;
  else if(path==='/auth/v1/user')data=user;
  else if(path==='/auth/v1/otp'){otpRedirect=url.searchParams.get('redirect_to');assert.equal(req.postDataJSON().create_user,false);data={};}
  else if(path==='/rest/v1/matches')data=missing?[]:[{id:mid,trip_id:'test-trip',parcel_id:pid,requester_id:other,status,updated_at:new Date().toISOString(),code_hash:null,trip:{from_city:'Paris',to_city:'Nairobi',traveler_id:role==='traveler'?uid:other,remaining_kg:9,profile:{id:role==='traveler'?uid:other,full_name:'Sample Traveller'}},parcel:{sender_id:role==='sender'?uid:other,weight_kg:1,profile:{id:role==='sender'?uid:other,full_name:'Sample Sender'}}}];
  else if(path==='/rest/v1/rpc/my_delivery_feedback')data=missing?[]:[{match_id:mid,can_review:status==='released',can_report_receipt:role==='sender'&&!['requested','declined'].includes(status),outcome,request_availability:'available'}];
  else if(path==='/rest/v1/rpc/my_delivery_report')data={on_hold:held,my_verified:true,partner_verified:true,report:held?{id:'issue',status:'open'}:null};
  else if(path==='/rest/v1/rpc/match_contact')data='+33600000000';
  else if(path==='/rest/v1/parcel_declarations'){
   data={parcel_id:pid,version:1,items:[{description:'Clothing'}],photo_paths:[],declared_value_usd:null,declared_at:new Date().toISOString()};
   if(url.searchParams.get('parcel_id')?.startsWith('in.'))data=[data];
  }
  else if(path==='/rest/v1/match_inspections')data=inspections;
  else if(path==='/rest/v1/match_safety_refusals')data=url.searchParams.get('match_id')?.startsWith('in.')?[]:null;
  else if(path==='/rest/v1/messages'){
   if(req.method()==='POST'){
    if(failMessage)return rejected('Temporary failure');
    const body=req.postDataJSON();messages.push({id:'msg'+messages.length,...body,created_at:new Date().toISOString()});writes.push(body);data=null;
   }else data=messages;
  }
  else if(path==='/rest/v1/rpc/record_delivery_feedback'){
   outcome=req.postDataJSON().p_outcome;writes.push({receipt:outcome});if(outcome==='received')status='released';data=null;
  }
  else if(path==='/rest/v1/profiles')data={id:uid,full_name:'Sample Sender'};
  else if(path==='/rest/v1/memberships'||path==='/rest/v1/verifications'||path==='/rest/v1/contact_details')data=null;
  else if(path.startsWith('/rest/v1/rpc/'))data=false;
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
 });
 // Block every non-local external request beyond the mocked API (no real email or telemetry).
 await page.route('**/*',async route=>{
  const host=new URL(route.request().url()).hostname;
  if(host==='127.0.0.1'||host==='bltaaidjhpkmwnsprenu.supabase.co')return route.fallback();
  return route.abort();
 });
 const target='/dashboard#delivery-'+mid;
 await page.goto(base+target);
 await page.waitForURL('**/auth?**');
 assert.equal(new URL(page.url()).searchParams.get('next'),target);
 await page.getByLabel('Email',{exact:true}).fill(user.email);
 await page.getByLabel('Password',{exact:true}).fill('test-password');
 await page.locator('button[type=submit]').click();
 await page.getByRole('tab',{name:'Delivery details',exact:true}).waitFor();
 await page.waitForFunction(()=>document.querySelector('[role=tab][aria-selected=true]')?.textContent==='Delivery details');
 assert.equal(new URL(page.url()).hash,'#delivery-'+mid);
 const panel=page.locator('#details-panel-'+mid);
 await panel.getByText('Clothing',{exact:true}).waitFor();
 await page.getByRole('tab',{name:'Messages',exact:true}).click();
 const wa=page.getByRole('link',{name:'WhatsApp',exact:true});await wa.waitFor();
 assert.match(new URL(await wa.getAttribute('href')).searchParams.get('text'),new RegExp('#delivery-'+mid));
 await page.getByRole('link',{name:'Confirm agreement',exact:true}).click();
 await panel.waitFor({state:'visible'});
 // An agreement is saved as our message, with a confirmation request, never as a state change.
 await panel.locator('summary').filter({hasText:'Record fee & handover'}).click();
 await panel.getByLabel('Total carrying fee',{exact:true}).fill('30');
 await panel.getByLabel('Collection and delivery arrangements',{exact:true}).fill('Collect on Friday in Paris; deliver to Nairobi.');
 failMessage=true;await panel.getByRole('button',{name:'Save details in chat',exact:true}).click();
 await panel.getByText('Couldn’t save. Please try again.',{exact:true}).waitFor();
 assert.equal(await panel.getByLabel('Total carrying fee',{exact:true}).inputValue(),'30');
 failMessage=false;await panel.getByRole('button',{name:'Save details in chat',exact:true}).click();
 await page.locator('#messages-'+mid).getByText(/Delivery agreement — please confirm/).waitFor();
 assert.equal(status,'accepted');assert.equal(writes.length,1);assert.match(writes[0].body,/EUR 30.00/);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:'/private/tmp/kifurushi-return-mobile.png',fullPage:true});
 // Same conversation can move from chat to delivery after opening a return link.
 await page.goto(base+target);await panel.waitFor({state:'visible'});
 // Magic-link query retains destination when Supabase consumes/replaces its hash.
 await page.goto(base+'/dashboard?returnTo='+encodeURIComponent(target));
 await panel.waitFor({state:'visible'});await page.waitForURL('**#delivery-'+mid);
 await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'/private/tmp/kifurushi-return-desktop.png',fullPage:true});
 // Sender receipt prompts remain truthful and don't silently confirm delivery.
 status='delivered';await page.reload();await panel.getByRole('button',{name:'Everything received',exact:true}).waitFor();
 await page.getByRole('tab',{name:'Messages',exact:true}).click();
 await page.getByRole('link',{name:'Has the parcel arrived?',exact:true}).click();
 await panel.getByRole('button',{name:'Everything received',exact:true}).click();
 assert.equal(status,'delivered');await panel.getByRole('button',{name:'Save receipt',exact:true}).click();
 await panel.getByText('Delivery feedback saved: Everything received',{exact:true}).waitFor();assert.equal(status,'released');
 await page.getByRole('tab',{name:'Messages',exact:true}).click();
 assert.equal(await page.getByRole('link',{name:'Leave a review',exact:true}).getAttribute('href'),'#review-'+mid);
 // Held deliveries prompt support and cannot encourage collection.
 status='escrow_paid';outcome=null;held=true;await page.reload();
 await page.getByRole('link',{name:'View delivery issue',exact:true}).waitFor();
 assert.equal(await page.getByRole('link',{name:'Confirm collection',exact:true}).count(),0);
 // A missing/other-account booking never silently selects an unrelated conversation.
 missing=true;await page.goto(base+target);await page.reload();
 await page.getByRole('alert').filter({hasText:'This delivery isn’t available for this account'}).waitFor();
 // Magic-link request points to the return-aware URL; test API intercept prevents actual sending.
 await page.evaluate(()=>localStorage.clear());
 await page.goto(base+'/auth?mode=signin&next='+encodeURIComponent(target));
 await page.getByLabel('Email',{exact:true}).fill(user.email);
 await page.getByRole('button',{name:/email.*sign.in link|send.*sign.in link/i}).click();
 assert.equal(new URL(otpRedirect).searchParams.get('returnTo'),target);
 assert.deepEqual(errors,[]);
 console.log('PASS: mobile/desktop return links, password + email sign-in, agreement draft retry, receipt confirmation, review, holds and wrong-account handling; no live sends.');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

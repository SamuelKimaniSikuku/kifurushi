const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
const base=process.env.KIFURUSHI_TEST_BASE || 'http://127.0.0.1:3021';
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message)}); page.setDefaultTimeout(12000);
  const uid='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222',mid='33333333-3333-4333-8333-333333333333',pid='44444444-4444-4444-8444-444444444444';
  const user={id:uid,aud:'authenticated',role:'authenticated',email:'delivery-test@example.com',user_metadata:{full_name:'Test Member'},app_metadata:{provider:'email'}};
  const token=[{alg:'HS256',typ:'JWT'},{sub:uid,role:'authenticated',exp:Math.floor(Date.now()/1000)+3600},'test-only'].map(v=>Buffer.from(typeof v==='string'?v:JSON.stringify(v)).toString('base64url')).join('.');
  let status='accepted',role='sender',version=1,inspections=[],refusal=null,failConfirm=false,failRead=false,releaseConfirmation=null;
  const checkLabel='I’ve checked the parcel. It contains no illegal or prohibited items, and I have no safety concerns.';
  const writes=[];
  let reportState={on_hold:false,my_verified:true,partner_verified:true,report:null},failReport=false,phoneVisible=false,smsEnabled=false,phoneConfirmed=false,adminMode=false,adminReads=0;
  const reportId='99999999-9999-4999-8999-999999999999';
  let caseStatus='open',restricted=false,caseNote=null;
  const evidence={trip:{from_city:'Nairobi',to_city:'Paris',depart_date:'2026-10-17',traveler_id:other},parcel:{description:'A document in an envelope',sender_id:uid,weight_kg:0.1},people:[{id:uid,name:'Test Sender',id_verified:true,phone:'+254700000001',phone_verified:true},{id:other,name:'Test Traveller',id_verified:true,phone_verified:false}],messages:[{id:'msg1',sender_id:uid,body:'Please deliver the parcel by Friday.',created_at:'2026-10-16T10:00:00Z'}],events:[{id:1,status:'picked_up',created_at:'2026-10-16T10:00:00Z'}]};
  const caseRow=()=>({photo_paths:photoPath?[photoPath]:[],received_weight_kg:1.1,id:reportId,match_id:mid,reporter_id:uid,reporter_name:'Test Sender',reason:'not_received',details:'The recipient has not received the parcel.',status:caseStatus,created_at:'2026-10-16T10:00:00Z',resolution:caseNote,from_city:'Nairobi',to_city:'Paris'});

  let outcome=null,pastDue=false,failReceipt=false,photoPath=null,reviews=[],feedbackSaves=0;
  let senderName='Test Sender',chatMessages=[],failMessage=false;
  const inspection=(r,v=version)=>({match_id:mid,user_id:r===role?uid:other,declaration_version:v,role:r,photo_paths:[],confirmed_at:'2026-10-15T10:00:00Z'});
  await page.route('https://bltaaidjhpkmwnsprenu.supabase.co/**',async route=>{
   const req=route.request(),path=new URL(req.url()).pathname;let data=[];
   const rejected=message=>route.fulfill({status:403,contentType:'application/json',body:JSON.stringify({message})});
   if(path==='/auth/v1/token')data={access_token:token,refresh_token:'test-only',expires_in:3600,token_type:'bearer',user};
   else if(path==='/auth/v1/user'){ if(req.method()==='PUT'){assert.equal(req.postDataJSON().phone,'+254700000001');writes.push({name:'sms'});} data=user; }
   else if(path==='/auth/v1/settings')data={external:{phone:smsEnabled},phone_autoconfirm:false};
   else if(path==='/auth/v1/verify'){const payload=req.postDataJSON();assert.equal(payload.type,'phone_change');if(payload.token==='000000')return rejected('Invalid code');phoneConfirmed=true;data={access_token:token,refresh_token:'test-only',expires_in:3600,token_type:'bearer',user};}
   else if(path==='/auth/v1/factors'){writes.push({name:'mfa_enroll'});data={id:'factor1',type:'totp',totp:{qr_code:'<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><rect width="240" height="240" fill="black"/></svg>',secret:'test-only'}};}
   else if(path==='/auth/v1/factors/factor1/challenge')data={id:'challenge1',expires_at:Math.floor(Date.now()/1000)+60};
   else if(path==='/auth/v1/factors/factor1/verify'){if(req.postDataJSON().code==='000000')return rejected('Invalid code');const secureToken=[{alg:'HS256',typ:'JWT'},{sub:uid,role:'authenticated',aal:'aal2',exp:Math.floor(Date.now()/1000)+3600},'test-only'].map(v=>Buffer.from(typeof v==='string'?v:JSON.stringify(v)).toString('base64url')).join('.');data={access_token:secureToken,refresh_token:'test-only',expires_in:3600,token_type:'bearer',user};}
   else if(path==='/rest/v1/rpc/my_delivery_report')data={...reportState,report:role==='sender'?reportState.report:null};
   else if(path==='/rest/v1/rpc/my_delivery_feedback')data=[{match_id:mid,can_review:!['requested','declined'].includes(status)&&(pastDue||!!outcome||status==='released'),can_report_receipt:role==='sender'&&!['requested','declined'].includes(status),outcome:role==='sender'?outcome:null}];
   else if(path==='/rest/v1/rpc/record_delivery_feedback'){
    const p=req.postDataJSON();assert.equal(p.p_match,mid);
    if(failReceipt)return rejected('Temporary failure');
    if(p.p_outcome==='missing_items'){assert.equal(p.p_received_weight,1.1);assert.equal(p.p_photos.length,1);assert.equal(p.p_photos[0],photoPath);}
    outcome=p.p_outcome;feedbackSaves++;writes.push({name:'receipt',payload:p});
    if(outcome!=='received')reportState={...reportState,on_hold:true,report:{id:reportId,status:'open',reason:outcome,resolution:null,created_at:'2026-10-19T10:00:00Z',photo_paths:p.p_photos,received_weight_kg:p.p_received_weight}};
    else if(['picked_up','in_transit','delivered'].includes(status))status='released';data=null;
   }
   else if(path.startsWith('/storage/v1/object/')){
    if(req.method()==='POST'){photoPath=path.split('/delivery-report-photos/')[1];assert(photoPath.startsWith(uid+'/'+mid+'/'));data={Key:'delivery-report-photos/'+photoPath};}
    else return route.fulfill({status:200,contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jP1sAAAAASUVORK5CYII=','base64')});
   }
   else if(path==='/rest/v1/reviews'){
    if(req.method()==='POST'){const p=req.postDataJSON();assert.equal(p.match_id,mid);assert(!['requested','declined'].includes(status));data={...p,id:'review-'+reviews.length,created_at:'2026-10-19T10:00:00Z',author:{full_name:'Test Member'}};reviews.push(data);writes.push({name:'review'});}else data=reviews;
   }
   else if(path==='/rest/v1/rpc/report_delivery'){if(failReport)return rejected('Temporary report failure');const p=req.postDataJSON();assert.equal(p.p_match,mid);assert.equal(p.p_reason,'not_received');reportState={...reportState,on_hold:true,report:{id:reportId,status:'open',reason:p.p_reason,resolution:null,created_at:'2026-10-16T10:00:00Z'}};writes.push({name:'report'});data=reportId;}
   else if(path==='/rest/v1/rpc/my_phone_verification')data={phone:phoneConfirmed?'+254700000001':null,verified:phoneConfirmed};
   else if(path==='/rest/v1/rpc/is_admin')data=adminMode;
   else if(path==='/rest/v1/rpc/admin_delivery_reports'){adminReads++;data=req.postDataJSON()?.p_id?{...caseRow(),snapshot:evidence,current_evidence:evidence,handover_record:evidence,restrictions:restricted?[{user_id:other,reason:'Under review'}]:[]}: [caseRow()];}
   else if(path==='/rest/v1/rpc/review_delivery_report'){const p=req.postDataJSON();assert.equal(p.p_id,reportId);caseStatus=p.p_status;caseNote=p.p_note;if(p.p_restrict)restricted=!p.p_lift;data=null;}
   else if(path==='/rest/v1/contact_details'&&phoneVisible)data={whatsapp_e164:'+254700000001'};
   else if(path==='/rest/v1/matches') data=[{id:mid,trip_id:'test-trip',parcel_id:pid,requester_id:other,status,updated_at:'2026-10-15T10:00:00Z',code_hash:null,trip:{from_city:'Paris',to_city:'Nairobi',traveler_id:role==='traveler'?uid:other,remaining_kg:9,profile:{id:role==='traveler'?uid:other,full_name:'Test Traveller'}},parcel:{sender_id:role==='sender'?uid:other,weight_kg:1,profile:{id:role==='sender'?uid:other,full_name:senderName}}}];
   else if(path==='/rest/v1/messages'){
    if(req.method()==='POST'){
     const payload=req.postDataJSON();assert.equal(payload.match_id,mid);assert.equal(payload.sender_id,uid);
     if(failMessage)return rejected('Test message failure');
     writes.push({name:'message',payload});chatMessages.push({...payload,id:'message-'+chatMessages.length,created_at:new Date().toISOString()});data=null;
    }else data=chatMessages;
   }
   else if(path==='/rest/v1/parcel_declarations'){data={parcel_id:pid,version,items:[{description:'Perfumes'}],photo_paths:[],declared_value_usd:null,declared_at:'2026-10-15T10:00:00Z'};if(new URL(req.url()).searchParams.get('parcel_id')?.startsWith('in.'))data=[data];}
   else if(path==='/rest/v1/match_inspections'){if(failRead)return rejected('Test read failure');data=inspections;}
   else if(path==='/rest/v1/match_safety_refusals')data=new URL(req.url()).searchParams.get('match_id')?.startsWith('in.')?(refusal?[refusal]:[]):refusal;
   else if(path==='/rest/v1/rpc/confirm_parcel_inspection'){
    const payload=req.postDataJSON();writes.push({name:'check',payload});
    assert.equal(payload.p_match_id,mid);assert.equal(payload.p_version,version);
    for(const k of ['p_opened','p_matches','p_sealed','p_no_concerns'])assert.equal(payload[k],true);
    await new Promise(resolve=>{releaseConfirmation=resolve;});
    if(failConfirm)return rejected('Complete traveller identity verification before confirming pickup.');
    inspections.push(inspection(role));data=null;
   } else if(path==='/rest/v1/rpc/advance_match'){
    writes.push({name:'advance',from:status});
    if(status==='accepted')status='escrow_paid';
    else if(status==='escrow_paid'){
     assert.equal(role,'traveler');assert.equal(new Set(inspections.filter(i=>i.declaration_version===version).map(i=>i.role)).size,2);
     status='picked_up';
    }else if(status==='picked_up')status='in_transit';
    else throw Error('Unexpected advance '+status);data=null;
   }else if(path==='/rest/v1/rpc/deliver_now'){
    assert(['picked_up','in_transit'].includes(status));writes.push({name:'arrived'});status='delivered';data=null;
   }else if(path==='/rest/v1/rpc/confirm_delivery'){
    assert.equal(status,'delivered');data=req.postDataJSON().p_code==='123456';if(data)status='released';
   }else if(path==='/rest/v1/rpc/sender_confirm_delivery'){
    assert.equal(role,'sender');assert(['picked_up','in_transit','delivered'].includes(status));status='released';data=null;
   }else if(path==='/rest/v1/rpc/refuse_parcel'){
    writes.push({name:'refuse'});refusal={match_id:mid,reason:req.postDataJSON().p_reason,notes:'',created_at:'2026-10-15T10:00:00Z'};status='cancelled';data=null;
   }else if(path==='/rest/v1/rpc/generate_delivery_code'){writes.push({name:'code'});data='123456';}
   else if(path==='/rest/v1/rpc/match_contact')data=null;
   else if(path.startsWith('/rest/v1/rpc/'))data=false;
   else if(path==='/rest/v1/profiles'&&req.method()==='GET')data={full_name:'Test Member',whatsapp_number:null};
   else if(path==='/rest/v1/memberships'||path==='/rest/v1/verifications'||path==='/rest/v1/contact_details')data=null;
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
  });

  await page.goto(base+'/auth?mode=signin&next=%2Fdashboard%23deliveries');
  await page.getByLabel('Email',{exact:true}).fill('delivery-test@example.com');
  await page.getByLabel('Password',{exact:true}).fill('test-password');
  await page.locator('button[type=submit]').click();
  await page.waitForURL('**/dashboard#deliveries');
  const report=page.getByRole('region',{name:'Report a problem',exact:true});
  const ratings=page.locator('#ratings');
  await report.getByRole('button',{name:'Some items missing',exact:true}).click();
  await report.getByLabel('What is missing or wrong?',{exact:true}).fill('I paid for 3 kg but received only 1.1 kg. One shirt is missing.');
  await report.getByLabel('Weight received (kg, optional)',{exact:true}).fill('1.1');
  await report.locator('summary').filter({hasText:'Photos (optional)'}).click();
  await report.locator('input[type=file]').setInputFiles({name:'parcel.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jP1sAAAAASUVORK5CYII=','base64')});
  await report.getByRole('button',{name:'Remove 1',exact:true}).waitFor();
  failReceipt=true;await report.getByRole('button',{name:'Send report',exact:true}).click();
  await report.getByText('Could not save. Your details are still here. Please try again.',{exact:true}).waitFor();
  assert((await report.getByLabel('What is missing or wrong?').inputValue()).includes('1.1 kg'));
  assert.equal(await report.locator('img').count(),1,'uploaded evidence retained after submit failure');
  await report.screenshot({path:'/private/tmp/kifurushi-feedback-form-mobile.png'});
  failReceipt=false;await report.getByRole('button',{name:'Send report',exact:true}).click();
  await report.getByText('Report received · #99999999',{exact:true}).waitFor();
  assert.equal(status,'accepted','partial receipt never marks delivered');assert.equal(feedbackSaves,1);
  assert.equal(writes.filter(w=>['check','advance'].includes(w.name)).length,0,'no invented inspections or stages');
  await ratings.getByRole('radio',{name:'2 out of 5 stars',exact:true}).locator('..').click();
  await ratings.getByLabel('Feedback about Test Traveller (optional)',{exact:true}).fill('Some items were missing.');
  await ratings.getByRole('button',{name:'Share review',exact:true}).click();
  await ratings.getByText('Some items were missing.',{exact:true}).waitFor();
  assert.equal(reviews.length,1);assert.equal(status,'accepted');
  assert.equal(await ratings.getByRole('button',{name:'Share review',exact:true}).count(),0,'one review after success');
  await report.screenshot({path:'/private/tmp/kifurushi-feedback-result-mobile.png'});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  // The traveller can review the accepted booking but cannot claim recipient receipt or see complaint photos.
  role='traveler';reviews=[];await page.reload();
  await ratings.getByText('Rate your sender',{exact:true}).waitFor();
  assert.equal(await report.getByRole('button',{name:'Everything received',exact:true}).count(),0);
  assert.equal(await report.locator('img').count(),0);
  // Overdue accepted bookings unlock reviews even when nobody updated collection.
  role='sender';outcome=null;pastDue=true;reportState={on_hold:false,report:null,my_verified:true,partner_verified:true};await page.reload();
  await ratings.getByRole('radio',{name:'1 out of 5 stars',exact:true}).locator('..').click();
  await ratings.getByRole('button',{name:'Share review',exact:true}).click();
  await ratings.getByText('Your review',{exact:true}).waitFor();assert.equal(status,'accepted');
  // All three translated choices fit on a small mobile screen.
  for(const [lang,label] of [['fr','Il manque des articles'],['sw','Baadhi ya vitu havipo'],['en','Some items missing']]){
   await page.evaluate(l=>localStorage.setItem('kifurushi.lang',l),lang);await page.reload();
   await page.getByRole('button',{name:label,exact:true}).waitFor();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile '+lang);
  }
  reviews=[];pastDue=false;status='requested';await page.reload();
  await page.getByText('Accept request',{exact:true}).waitFor();
  assert.equal(await ratings.getByRole('radio').count(),0);
  assert.equal(await report.getByRole('button',{name:'Everything received',exact:true}).count(),0);
  // A normal, already collected parcel still completes using the existing receipt path.
  status='picked_up';await page.reload();
  await report.getByRole('button',{name:'Everything received',exact:true}).click();
  await report.getByRole('button',{name:'Save receipt',exact:true}).click();
  await report.getByText('Delivery feedback saved: Everything received',{exact:true}).waitFor();assert.equal(status,'released');
  assert.equal(reportState.on_hold,false);
  await report.getByRole('button',{name:'Update receipt',exact:true}).click();
  await report.getByRole('button',{name:'Some items missing',exact:true}).waitFor();
  await page.setViewportSize({width:1280,height:1000});await page.screenshot({path:'/private/tmp/kifurushi-feedback-desktop.png',fullPage:true});
  // Case details show optional photo and reported weight behind the existing MFA gate.
  adminMode=true;user.factors=[];await page.goto(base+'/admin/reports');
  await page.getByRole('button',{name:'Set up authenticator',exact:true}).click();assert.equal(adminReads,0);
  await page.getByLabel('Authenticator code',{exact:true}).fill('123456');
  await page.getByRole('button',{name:'Continue securely',exact:true}).click();
  await page.getByRole('button',{name:/#99999999.*Parcel not received/}).click();
  await page.getByText('Reported weight received: 1.1 kg',{exact:true}).waitFor();
  await page.waitForFunction(()=>[...document.querySelectorAll('article img')].some(i=>i.complete&&i.naturalWidth>0));
  await page.screenshot({path:'/private/tmp/kifurushi-feedback-admin.png',fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('PASS: partial delivery, optional private photo and weight, failure/retry, no false completion, review during complaint, traveller review, overdue review, unaccepted refusal, full receipt, EN/FR/SW mobile, admin MFA/evidence. All customer actions mocked.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});

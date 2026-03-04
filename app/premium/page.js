'use client';
import { Check } from 'lucide-react';
export default function PremiumPage() {
  return (
    <div style={{maxWidth:'1100px',margin:'0 auto',padding:'48px 16px'}}>
      <div style={{textAlign:'center',marginBottom:'48px'}}>
        <h1 style={{fontSize:'2.5rem',fontWeight:'bold',marginBottom:'16px'}}>Earn More. Ship More. Pay Less.</h1>
        <p style={{fontSize:'1.2rem',color:'#666',maxWidth:'600px',margin:'0 auto'}}>Upgrade to Premium and unlock unlimited trips, lower fees, and priority features.</p>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'24px',marginBottom:'64px'}}>
        <div style={{background:'#fff',borderRadius:'12px',padding:'32px',border:'1px solid #e5e5e5',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
          <h3 style={{fontSize:'1.25rem',fontWeight:'bold'}}>Free</h3>
          <p style={{color:'#666',fontSize:'0.9rem',marginBottom:'16px'}}>Get started with basics</p>
          <div style={{marginBottom:'24px'}}><span style={{fontSize:'2.5rem',fontWeight:'bold'}}>&#8364;0</span><span style={{color:'#999'}}>/month</span></div>
          <ul style={{listStyle:'none',padding:0,marginBottom:'24px'}}>{['3 trips/month','Basic search','Community ratings','5% escrow fee'].map(function(f,i){return <li key={i} style={{padding:'6px 0',fontSize:'0.9rem',color:'#555'}}>&#10003; {f}</li>})}</ul>
          <button disabled style={{width:'100%',padding:'12px',borderRadius:'8px',border:'2px solid #ddd',color:'#aaa',fontWeight:'600',background:'#fff',cursor:'not-allowed'}}>Current Plan</button>
        </div>
        <div style={{background:'#fff',borderRadius:'12px',padding:'32px',border:'2px solid #f97316',boxShadow:'0 2px 8px rgba(0,0,0,0.06)',position:'relative'}}>
          <div style={{position:'absolute',top:'-12px',left:'50%',transform:'translateX(-50%)',background:'#f97316',color:'#fff',fontSize:'0.7rem',fontWeight:'bold',padding:'4px 16px',borderRadius:'20px'}}>MOST POPULAR</div>
          <h3 style={{fontSize:'1.25rem',fontWeight:'bold'}}>Premium</h3>
          <p style={{color:'#666',fontSize:'0.9rem',marginBottom:'16px'}}>For active community members</p>
          <div style={{marginBottom:'24px'}}><span style={{fontSize:'2.5rem',fontWeight:'bold',color:'#f97316'}}>&#8364;4.99</span><span style={{color:'#999'}}>/month</span></div>
          <ul style={{listStyle:'none',padding:0,marginBottom:'24px'}}>{['Unlimited trips','Priority listing','3% escrow fee','Premium badge','Route alerts'].map(function(f,i){return <li key={i} style={{padding:'6px 0',fontSize:'0.9rem',color:'#555'}}>&#10003; {f}</li>})}</ul>
          <a href="https://buy.stripe.com/test_aFa4gzdx0bWUdAl4rVdwc00" style={{display:'block',width:'100%',padding:'12px',borderRadius:'8px',background:'#f97316',color:'#fff',fontWeight:'bold',textAlign:'center',textDecoration:'none',boxSizing:'border-box'}}>Get Premium</a>
        </div>
        <div style={{background:'#111827',borderRadius:'12px',padding:'32px',color:'#fff',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
          <h3 style={{fontSize:'1.25rem',fontWeight:'bold'}}>Pro Carrier</h3>
          <p style={{color:'#9ca3af',fontSize:'0.9rem',marginBottom:'16px'}}>For power travelers</p>
          <div style={{marginBottom:'24px'}}><span style={{fontSize:'2.5rem',fontWeight:'bold',color:'#facc15'}}>&#8364;12.99</span><span style={{color:'#9ca3af'}}>/month</span></div>
          <ul style={{listStyle:'none',padding:0,marginBottom:'24px'}}>{['Everything in Premium','0% escrow fee','Pro Diamond badge','Bulk tools','Priority support'].map(function(f,i){return <li key={i} style={{padding:'6px 0',fontSize:'0.9rem',color:'#d1d5db'}}>&#10003; {f}</li>})}</ul>
          <a href="https://buy.stripe.com/test_aFa4gzdx0bWUdAl4rVdwc00" style={{display:'block',width:'100%',padding:'12px',borderRadius:'8px',background:'#facc15',color:'#111827',fontWeight:'bold',textAlign:'center',textDecoration:'none',boxSizing:'border-box'}}>Get Pro</a>
        </div>
      </div>
    </div>
  );
}

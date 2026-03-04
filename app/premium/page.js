'use client';
export default function PremiumPage() {
  return (
    <div style={{maxWidth:'1100px',margin:'0 auto',padding:'48px 16px'}}>
      <div style={{textAlign:'center',marginBottom:'48px'}}>
        <h1 style={{fontSize:'2.5rem',fontWeight:'bold',marginBottom:'16px'}}>Earn More. Ship More. Pay Less.</h1>
        <p style={{fontSize:'1.2rem',color:'#666'}}>Upgrade to Premium and unlock unlimited trips, lower fees, and priority features.</p>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'24px'}}>
        <div style={{background:'#fff',borderRadius:'12px',padding:'32px',border:'1px solid #e5e5e5'}}>
          <h3 style={{fontSize:'1.25rem',fontWeight:'bold'}}>Free</h3>
          <div style={{margin:'16px 0'}}><span style={{fontSize:'2.5rem',fontWeight:'bold'}}>EUR 0</span>/month</div>
          <p style={{color:'#666',fontSize:'0.9rem'}}>3 trips/month, 5% escrow fee, basic search</p>
        </div>
        <div style={{background:'#fff',borderRadius:'12px',padding:'32px',border:'2px solid #f97316'}}>
          <h3 style={{fontSize:'1.25rem',fontWeight:'bold'}}>Premium</h3>
          <div style={{margin:'16px 0'}}><span style={{fontSize:'2.5rem',fontWeight:'bold',color:'#f97316'}}>EUR 4.99</span>/month</div>
          <p style={{color:'#666',fontSize:'0.9rem',marginBottom:'16px'}}>Unlimited trips, 3% fee, priority listing, trust badge</p>
          <a href='https://buy.stripe.com/test_aFa4gzdx0bWUdAl4rVdwc00' style={{display:'block',padding:'12px',borderRadius:'8px',background:'#f97316',color:'#fff',fontWeight:'bold',textAlign:'center',textDecoration:'none'}}>Get Premium</a>
        </div>
        <div style={{background:'#111827',borderRadius:'12px',padding:'32px',color:'#fff'}}>
          <h3 style={{fontSize:'1.25rem',fontWeight:'bold'}}>Pro Carrier</h3>
          <div style={{margin:'16px 0'}}><span style={{fontSize:'2.5rem',fontWeight:'bold',color:'#facc15'}}>EUR 12.99</span><span style={{color:'#9ca3af'}}>/month</span></div>
          <p style={{color:'#9ca3af',fontSize:'0.9rem',marginBottom:'16px'}}>0% fee, Pro badge, bulk tools, priority support</p>
          <a href='https://buy.stripe.com/test_aFa4gzdx0bWUdAl4rVdwc00' style={{display:'block',padding:'12px',borderRadius:'8px',background:'#facc15',color:'#111827',fontWeight:'bold',textAlign:'center',textDecoration:'none'}}>Get Pro</a>
        </div>
      </div>
    </div>
  );
}

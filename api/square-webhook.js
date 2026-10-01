import crypto from 'crypto';

const NOTIFICATION_URL='https://marinade-order-1.vercel.app/api/square-webhook';

function verifySquareSignature(rawBody, signature){
  const key=process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  if(!key||!signature) return false;
  const expected=crypto.createHmac('sha256',key)
    .update(NOTIFICATION_URL+rawBody,'utf8')
    .digest('base64');
  const a=Buffer.from(expected);
  const b=Buffer.from(signature);
  return a.length===b.length && crypto.timingSafeEqual(a,b);
}

async function rawBody(req){
  if(typeof req.body==='string') return req.body;
  if(Buffer.isBuffer(req.body)) return req.body.toString('utf8');
  const chunks=[];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).end();
  try{
    const raw=await rawBody(req);
    const signature=req.headers['x-square-hmacsha256-signature'];
    if(!verifySquareSignature(raw,signature)) return res.status(403).json({error:'Invalid Square signature'});

    const event=JSON.parse(raw);
    if(event.type!=='payment.updated') return res.status(200).json({received:true});

    const payment=event?.data?.object?.payment;
    if(!payment) return res.status(200).json({received:true});
    if(payment.status!=='COMPLETED') return res.status(200).json({received:true,status:payment.status});

    console.log(JSON.stringify({
      event:'MARINADE_SQUARE_PAYMENT_CONFIRMED',
      paymentId:payment.id,
      orderId:payment.order_id,
      note:payment.note,
      amount:payment.amount_money?.amount,
      currency:payment.amount_money?.currency,
      status:payment.status
    }));

    return res.status(200).json({received:true,verified:true});
  }catch(e){
    console.error('Square webhook error',e);
    return res.status(400).json({error:'Invalid webhook payload'});
  }
}

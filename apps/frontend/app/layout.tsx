import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Unified OTT Platform",
  description: "Netflix + Prime + JioHotstar inspired OTT platform"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-gray-50">
        {process.env.NEXT_PUBLIC_GA4_ID ? (
          <>
            <Script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA4_ID}`} />
            <Script id="ga4-init">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${process.env.NEXT_PUBLIC_GA4_ID}');`}
            </Script>
          </>
        ) : null}
        {process.env.NEXT_PUBLIC_MIXPANEL_TOKEN ? (
          <Script id="mixpanel-init">
            {`(function(f,b){if(!b.__SV){var a,e,i,g;window.mixpanel=b;b._i=[];
b.init=function(a,e,d){function f(b,h){var a=h.split(".");2==a.length&&(b=b[a[0]],h=a[1]);b[h]=function(){b.push([h].concat(Array.prototype.slice.call(arguments,0)))}}var c=b;"undefined"!==typeof d?c=b[d]=[]:d="mixpanel";c.people=c.people||[];c.toString=function(b){var a="mixpanel";"mixpanel"!==d&&(a+="."+d);b||(a+=" (stub)");return a};c.people.toString=function(){return c.toString(1)+".people (stub)"};i="disable time_event track track_pageview track_links track_forms register register_once alias unregister identify name_tag set_config reset people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user".split(" ");
for(g=0;g<i.length;g++)f(c,i[g]);b._i.push([a,e,d])};b.__SV=1.2;a=f.createElement("script");a.type="text/javascript";a.async=!0;a.src="https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";e=f.getElementsByTagName("script")[0];e.parentNode.insertBefore(a,e)}})(document,window.mixpanel||[]);
mixpanel.init('${process.env.NEXT_PUBLIC_MIXPANEL_TOKEN}');`}
          </Script>
        ) : null}
        {process.env.NEXT_PUBLIC_AMPLITUDE_KEY ? (
          <Script id="amplitude-init">
            {`(function(){var e=window.amplitude||{_q:[],_iq:{}};window.amplitude=e;function t(e){return function(){e._q.push([].slice.call(arguments,0))}}var n=["init","logEvent","identify","setUserId","setUserProperties"];for(var i=0;i<n.length;i++)e[n[i]]=t(e);var a=document.createElement("script");a.type="text/javascript";a.async=true;a.src="https://cdn.amplitude.com/libs/amplitude-8.17.0-min.gz.js";var s=document.getElementsByTagName("script")[0];s.parentNode.insertBefore(a,s)})();
amplitude.init('${process.env.NEXT_PUBLIC_AMPLITUDE_KEY}');`}
          </Script>
        ) : null}
        {children}
      </body>
    </html>
  );
}

import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { Card, Slider, bytesFmt, fmt } from './AdvKit';
import { cardinality } from './tsGorilla';

/** Cardinality explosion. Series = product of label value counts. Assumes every series gets a sample on every scrape. */
const log = (t: number, lo: number, hi: number) => Math.round(lo * Math.pow(hi / lo, t / 100));

export default function TsCardinality() {
  const [hosts, setHosts] = useState(10);
  const [endpoints, setEndpoints] = useState(5);
  const [status, setStatus] = useState(1);
  const [userT, setUserT] = useState(0);
  const users = userT === 0 ? 1 : log(userT, 10, 1_000_000);
  const c = cardinality({ hosts, endpoints, statusCodes: status, users, scrapeSeconds: 15, bytesPerSample: 1.5, retentionDays: 15 });
  const huge = c.series > 1_000_000;
  return (
    <CacheWidgetFrame title="How many series does one metric make?" hint="every label combination is a new series">
      <div className="grid gap-4 text-sm md:grid-cols-[16rem_1fr]">
        <div className="space-y-3">
          <Slider id="ts-hosts" label="Label host: values" value={hosts} min={1} max={200} onChange={setHosts} show={fmt(hosts)} />
          <Slider id="ts-ep" label="Label endpoint: values" value={endpoints} min={1} max={50} onChange={setEndpoints} show={fmt(endpoints)} />
          <Slider id="ts-st" label="Label status: values" value={status} min={1} max={10} onChange={setStatus} show={fmt(status)} />
          <Slider id="ts-us" label="Label user_id: values" value={userT} min={0} max={100} onChange={setUserT} show={userT === 0 ? 'not used' : fmt(users)} />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Card title="Series" value={fmt(c.series)} note={`${hosts} × ${endpoints} × ${status} × ${users}`} tone={huge ? 'bad' : 'ok'} />
          <Card title="Samples per day" value={fmt(c.samplesPerDay)} note="One sample per series every 15 s: 5,760 per series." />
          <Card title="Disk per day" value={bytesFmt(c.bytesPerDay)} note="Assumes 1.5 bytes per sample. Real stores quote 1 to 2." />
          <Card title="Disk for 15 days" value={bytesFmt(c.totalBytes)} note="Retention is how long data is kept. 15 days is a common default." tone={huge ? 'bad' : undefined} />
        </div>
      </div>
    </CacheWidgetFrame>
  );
}

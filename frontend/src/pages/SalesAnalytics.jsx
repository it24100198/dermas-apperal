import { useState, useEffect } from 'react';
import { getSalesAnalytics } from '../api/sales';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const COLORS = ['#7c3aed','#2563eb','#059669','#d97706','#dc2626','#0891b2','#7c3aed','#16a34a','#ca8a04','#be123c'];
const fmt = (n) => 'Rs. ' + Number(n||0).toLocaleString('en-LK',{maximumFractionDigits:0});

export default function SalesAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  const load = async () => {
    setLoading(true);
    try { setData(await getSalesAnalytics(year)); }
    catch{} finally{setLoading(false);}
  };
  useEffect(()=>{load();},[year]);

  // Build full 12-month array
  const monthlyChart = MONTHS.map((_,i)=>{
    const found = data?.monthlyRevenue?.find(m=>m._id===i+1);
    return { month: MONTHS[i], revenue: found?.revenue||0, paid: found?.paid||0 };
  });

  const grossProfit = (data?.margins||[]).reduce((s,m)=>s+(m.profit||0),0);
  const totalRevenue = data?.totalRevenue||0;
  const margin = totalRevenue>0 ? ((grossProfit/totalRevenue)*100).toFixed(1) : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-800">Sales Analytics</h1>
          <p className="text-slate-500 text-sm">Revenue performance, top items, and profit margin analysis</p></div>
        <select value={year} onChange={e=>setYear(Number(e.target.value))}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
          {[2023,2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {label:'Total Invoiced',value:fmt(totalRevenue),icon:'bi-graph-up-arrow',color:'text-purple-600 bg-purple-50'},
          {label:'Collected',value:fmt(data?.totalPaid),icon:'bi-cash-stack',color:'text-emerald-600 bg-emerald-50'},
          {label:'Outstanding',value:fmt(data?.totalOutstanding),icon:'bi-exclamation-circle-fill',color:'text-rose-600 bg-rose-50'},
          {label:'Gross Margin',value:`${margin}%`,icon:'bi-percent',color:'text-indigo-600 bg-indigo-50'},
        ].map(c=>(
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.color}`}><i className={`bi ${c.icon} text-xl`}/></div>
            <div><p className="text-xl font-bold text-slate-800">{loading?'…':c.value}</p><p className="text-xs text-slate-500">{c.label}</p></div>
          </div>
        ))}
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="font-semibold text-slate-700 mb-4 text-sm">Monthly Revenue vs Collections — {year}</h2>
        {loading?<div className="h-52 flex items-center justify-center text-slate-400">Loading…</div>:(
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyChart} margin={{top:0,right:0,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="month" tick={{fontSize:11,fill:'#94a3b8'}}/>
              <YAxis tick={{fontSize:11,fill:'#94a3b8'}} tickFormatter={v=>`Rs.${(v/1000).toFixed(0)}k`}/>
              <Tooltip formatter={(v)=>`Rs. ${v.toLocaleString()}`} labelStyle={{fontWeight:600}}/>
              <Bar dataKey="revenue" name="Invoiced" fill="#7c3aed" radius={[4,4,0,0]} maxBarSize={28}/>
              <Bar dataKey="paid" name="Collected" fill="#10b981" radius={[4,4,0,0]} maxBarSize={28}/>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Top Items by Revenue */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-700 mb-4 text-sm">Top Items by Revenue</h2>
          {loading?<div className="h-48 flex items-center justify-center text-slate-400">Loading…</div>
            :!data?.topItems?.length?<div className="h-48 flex items-center justify-center text-slate-300 text-sm">No data</div>:(
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.topItems.slice(0,7)} layout="vertical" margin={{left:8,right:16}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false}/>
                <XAxis type="number" tick={{fontSize:10,fill:'#94a3b8'}} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                <YAxis type="category" dataKey="_id" width={100} tick={{fontSize:10,fill:'#64748b'}}/>
                <Tooltip formatter={v=>`Rs. ${v.toLocaleString()}`}/>
                <Bar dataKey="totalRevenue" name="Revenue" radius={[0,4,4,0]} maxBarSize={16}>
                  {(data.topItems||[]).map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Profit Margin Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-700 mb-4 text-sm">Profit Margin Analysis</h2>
          {loading?<div className="h-48 flex items-center justify-center text-slate-400">Loading…</div>
            :!data?.margins?.length?<div className="h-48 flex items-center justify-center text-slate-300 text-sm">No data. Add cost prices to Sales Orders.</div>:(
            <div className="overflow-auto max-h-48">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-50">
                  <tr>{['Item','Revenue','Cost','Profit','Margin%'].map(h=><th key={h} className="px-2 py-2 text-left font-medium text-slate-500">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.margins.map((m,i)=>{
                    const marginPct = m.totalRevenue>0?((m.profit/m.totalRevenue)*100).toFixed(1):0;
                    return (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-2 py-2 font-medium text-slate-800 max-w-[120px] truncate">{m._id}</td>
                        <td className="px-2 py-2 text-slate-600">{fmt(m.totalRevenue)}</td>
                        <td className="px-2 py-2 text-slate-500">{fmt(m.totalCost)}</td>
                        <td className={`px-2 py-2 font-medium ${m.profit>=0?'text-emerald-700':'text-red-600'}`}>{fmt(m.profit)}</td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1">
                            <div className="flex-1 bg-slate-100 rounded-full h-1.5 w-12">
                              <div className={`h-1.5 rounded-full ${Number(marginPct)>=20?'bg-emerald-500':Number(marginPct)>=10?'bg-amber-500':'bg-red-400'}`} style={{width:`${Math.min(100,Math.max(0,Number(marginPct)))}%`}}/>
                            </div>
                            <span className={`font-bold ${Number(marginPct)>=20?'text-emerald-700':Number(marginPct)>=10?'text-amber-700':'text-red-600'}`}>{marginPct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Order Status Breakdown */}
      {data?.orderCounts?.length>0&&(
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-700 mb-4 text-sm">Order Status Breakdown</h2>
          <div className="flex items-center justify-around flex-wrap gap-4">
            {data.orderCounts.map((o,i)=>(
              <div key={o._id} className="text-center">
                <p className="text-3xl font-bold text-slate-800">{o.count}</p>
                <span className="text-xs text-slate-500 capitalize">{o._id}</span>
                <div className="w-2 h-2 rounded-full mx-auto mt-1" style={{background:COLORS[i%COLORS.length]}}/>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// Professional Military/Tactical Color Palette
const COLORS = [
  '#D4AF37', // Gold (Leadership)
  '#22C55E', // Green (Initiative)
  '#3B82F6', // Blue (Intelligence)
  '#EF4444', // Red (Determination)
  '#A855F7', // Purple (Adaptability)
  '#F97316', // Orange (Social)
  '#06B6D4'  // Cyan (Stamina)
];

interface WATResult {
  primary_olq: string;
  [key: string]: any;
}

const WATReport = ({ results }: { results: WATResult[] }) => {
  // Aggregate results to count how many times each OLQ appeared
  const chartData = results.reduce((acc: any[], curr) => {
    const existing = acc.find(item => item.name === curr.primary_olq);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: curr.primary_olq, value: 1 });
    }
    return acc;
  }, []);

  return (
    <div className="w-full bg-slate-900 border border-gold/20 p-6 rounded-2xl shadow-2xl my-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gold tracking-tight">Psychological Performance Profile</h3>
        <p className="text-gray-400 text-sm italic">Based on 15 core Officer Like Qualities</p>
      </div>
      
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={8}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0f172a', 
                border: '1px solid #D4AF37', 
                borderRadius: '12px',
                color: '#fff' 
              }}
              itemStyle={{ color: '#fff' }}
              cursor={{ fill: 'transparent' }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle"
              wrapperStyle={{ paddingTop: '20px', color: '#94a3b8' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 p-4 bg-gold/5 rounded-lg border border-gold/10">
        <p className="text-xs text-center text-gold/60 uppercase tracking-widest">
          Analysis provided by Random Forest ML Engine
        </p>
      </div>
    </div>
  );
};

export default WATReport;
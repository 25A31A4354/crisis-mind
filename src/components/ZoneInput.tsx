import React, { useRef } from 'react';
import { Zone } from '@/types/crisis';

const PREDEFINED_LOCATIONS = [
  { name: "Hyderabad", state: "Telangana", lat: 17.3850, lng: 78.4867 },
  { name: "Warangal", state: "Telangana", lat: 17.9784, lng: 79.5941 },
  { name: "Vijayawada", state: "Andhra Pradesh", lat: 16.5062, lng: 80.6480 },
  { name: "Guntur", state: "Andhra Pradesh", lat: 16.3067, lng: 80.4365 },
  { name: "Visakhapatnam", state: "Andhra Pradesh", lat: 17.6868, lng: 83.2185 },
  { name: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707 },
  { name: "Bangalore", state: "Karnataka", lat: 12.9716, lng: 77.5946 },
  { name: "Mumbai", state: "Maharashtra", lat: 19.0760, lng: 72.8777 }
];

function SearchableLocationSelect({ value, onChange, disabled }: { value: string, onChange: (val: string) => void, disabled?: boolean }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredLocations = PREDEFINED_LOCATIONS.filter(loc => 
    loc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    loc.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedLocations = filteredLocations.reduce((acc, loc) => {
    if (!acc[loc.state]) acc[loc.state] = [];
    acc[loc.state].push(loc);
    return acc;
  }, {} as Record<string, typeof PREDEFINED_LOCATIONS>);

  const selectedLoc = PREDEFINED_LOCATIONS.find(loc => loc.name === value);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div 
        className={`w-full h-10 px-3 text-sm rounded-lg shadow-sm border bg-white flex items-center justify-between cursor-pointer ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' : 'border-gray-200 hover:border-blue-500 focus:ring-blue-500'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={selectedLoc ? 'text-gray-900' : 'text-gray-500'}>
          {selectedLoc ? `${selectedLoc.name}, ${selectedLoc.state}` : 'Select a location...'}
        </span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search city or state..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {Object.keys(groupedLocations).length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">No locations found</div>
            ) : (
              Object.entries(groupedLocations).map(([state, cities]) => (
                <div key={state}>
                  <div className="px-3 py-1.5 text-xs font-bold tracking-wider text-gray-500 uppercase bg-gray-50/80 sticky top-0">
                    {state}
                  </div>
                  {cities.map(city => (
                    <div 
                      key={city.name}
                      className={`px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 ${value === city.name ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                      onClick={() => {
                        onChange(city.name);
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                    >
                      {city.name}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type ZoneInputProps = {
  zones: Zone[];
  setZones: (zones: Zone[]) => void;
  disabled?: boolean;
};

export default function ZoneInput({
  zones, setZones,
  disabled = false
}: ZoneInputProps) {
  const zoneRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleAddZone = () => {
    // Enforce max 5 zones as requested
    if (zones.length >= 5) return;
    
    const newZones: Zone[] = [
      ...zones,
      { 
        id: Date.now().toString(), 
        name: "", 
        people: 0, 
        severity: "", 
        vulnerability: "", 
        accessibility: "", 
        infrastructureDamage: "", 
        urgency: "",
        notes: "",
        isManualOverride: false
      }
    ];
    setZones(newZones);
    
    setTimeout(() => {
      zoneRefs.current[newZones.length - 1]?.scrollIntoView({
        behavior: "smooth",
        block: "end"
      });
      const newCard = zoneRefs.current[newZones.length - 1];
      if (newCard) {
        const select = newCard.querySelector('select') as HTMLSelectElement;
        if (select) select.focus();
      }
    }, 100);
  };

  const handleRemoveZone = (id: string) => {
    setZones(zones.filter(z => z.id !== id));
  };

  const handleChange = (id: string, field: keyof Zone, value: string | number | boolean) => {
    setZones(zones.map(z => z.id === id ? { ...z, [field]: value } : z));
  };

  return (
    <section className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm p-6 flex flex-col max-h-[850px]">
      <div className="flex justify-between items-start mb-1">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">Scenario Input Panel</div>
          <h2 className="text-xl font-black tracking-tight text-gray-900">Crisis Scenario Input</h2>
        </div>
        <button 
          onClick={handleAddZone} 
          disabled={disabled || zones.length >= 5}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-blue-200 mt-1"
        >
          {zones.length >= 5 ? "Max Zones Reached" : "+ Add Zone"}
        </button>
      </div>

      <div className="overflow-y-auto pr-2 flex-1 mt-2 space-y-4">
        {zones.map((zone, index) => (
          <div 
            key={zone.id} 
            ref={el => { zoneRefs.current[index] = el; }}
            className={`border rounded-xl p-4 mb-4 relative shadow-sm transition-colors ${zone.isManualOverride ? 'bg-red-50/40 border-red-200' : 'bg-gray-50/50 border-gray-200'}`}
          >
            <div className={`flex items-center justify-between border-b border-gray-200 py-1.5 px-2 mb-4 rounded-t-lg transition-colors ${zone.isManualOverride ? 'bg-red-50/50' : 'bg-transparent'}`}>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-black">{index + 1}</div>
                <h3 className="text-xs font-black uppercase tracking-tight text-gray-800">Zone Details</h3>
              </div>

              <div className="flex items-center justify-between flex-1 ml-6">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    id={`override-${zone.id}`}
                    checked={!!zone.isManualOverride}
                    onChange={(e) => handleChange(zone.id, 'isManualOverride', e.target.checked)}
                    disabled={disabled}
                    className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500 disabled:opacity-50 shrink-0 cursor-pointer"
                  />
                  <label
                    htmlFor={`override-${zone.id}`}
                    className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors select-none ${zone.isManualOverride ? 'text-red-600' : 'text-gray-400 hover:text-red-500'}`}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Manual Priority Override
                  </label>
                  {zone.isManualOverride && (
                    <span className="text-[10px] text-red-600 font-bold italic ml-1">· Bypasses system logic</span>
                  )}
                </div>

                {zones.length > 1 && (
                  <button 
                    onClick={() => handleRemoveZone(zone.id)}
                    disabled={disabled}
                    title="Remove zone"
                    className="flex items-center justify-center text-gray-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="col-span-1">
                <label className="block text-sm text-gray-500 mb-1">Location</label>
                <SearchableLocationSelect
                  value={zone.name}
                  onChange={(newName) => {
                    const selectedLoc = PREDEFINED_LOCATIONS.find(loc => loc.name === newName);
                    if (selectedLoc) {
                      setZones(zones.map(z => z.id === zone.id ? { 
                        ...z, 
                        name: selectedLoc.name, 
                        lat: selectedLoc.lat, 
                        lng: selectedLoc.lng 
                      } : z));
                    } else {
                      setZones(zones.map(z => z.id === zone.id ? { 
                        ...z, 
                        name: "", 
                        lat: undefined, 
                        lng: undefined 
                      } : z));
                    }
                  }}
                  disabled={disabled}
                />
              </div>
              
              <div className="col-span-1">
                <label className="block text-sm text-gray-500 mb-1">People at Risk</label>
                <input 
                  type="number" 
                  min="0"
                  value={zone.people === 0 ? "" : zone.people} 
                  onChange={(e) => handleChange(zone.id, 'people', parseInt(e.target.value, 10) || 0)}
                  disabled={disabled}
                  placeholder="0"
                  className="w-full h-10 px-3 text-sm border-gray-200 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 border bg-white"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-sm text-gray-500 mb-1">Severity</label>
                <select
                  value={zone.severity}
                  onChange={(e) => handleChange(zone.id, 'severity', e.target.value)}
                  disabled={disabled}
                  className={`w-full h-10 px-3 text-sm rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 border ${
                    zone.severity === 'High' ? 'bg-red-50 text-red-800 border-red-300 font-semibold' :
                    zone.severity === 'Medium' ? 'bg-yellow-50 text-yellow-800 border-yellow-300 font-semibold' :
                    zone.severity === 'Low' ? 'bg-gray-100 text-gray-800 border-gray-300' :
                    'bg-white border-gray-200'
                  }`}
                >
                  <option value="">Select...</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-sm text-gray-500 mb-1">Vulnerability</label>
                <select
                  value={zone.vulnerability}
                  onChange={(e) => handleChange(zone.id, 'vulnerability', e.target.value)}
                  disabled={disabled}
                  className="w-full h-10 px-3 text-sm border-gray-200 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 border bg-white"
                >
                  <option value="">Select...</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-sm text-gray-500 mb-1">Accessibility</label>
                <select
                  value={zone.accessibility}
                  onChange={(e) => handleChange(zone.id, 'accessibility', e.target.value)}
                  disabled={disabled}
                  className="w-full h-10 px-3 text-sm border-gray-200 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 border bg-white"
                >
                  <option value="">Select...</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-sm text-gray-500 mb-1">Infrastructure Damage</label>
                <select
                  value={zone.infrastructureDamage}
                  onChange={(e) => handleChange(zone.id, 'infrastructureDamage', e.target.value)}
                  disabled={disabled}
                  className="w-full h-10 px-3 text-sm border-gray-200 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 border bg-white"
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-sm text-gray-500 mb-1">Urgency Window</label>
                <select
                  value={zone.urgency}
                  onChange={(e) => handleChange(zone.id, 'urgency', e.target.value)}
                  disabled={disabled}
                  className={`w-full h-10 px-3 text-sm rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 border ${
                    zone.urgency === 'Critical' ? 'bg-red-50 text-red-800 border-red-300 font-bold' :
                    zone.urgency === 'Risky' ? 'bg-orange-50 text-orange-800 border-orange-300 font-semibold' :
                    zone.urgency === 'Stable' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                    'bg-white border-gray-200'
                  }`}
                >
                  <option value="">Select...</option>
                  <option value="Critical">Critical (&lt;3 hrs)</option>
                  <option value="Risky">Risky (3–6 hrs)</option>
                  <option value="Stable">Stable (6+ hrs)</option>
                </select>
              </div>

            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

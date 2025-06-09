'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Member from '@/components/Member';
import Menu from '@/components/Menu';

export default function Home() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStartStation, setSelectedStartStation] = useState('');
  const [selectedEndStation, setSelectedEndStation] = useState('');
  const [fare, setFare] = useState(null);
  
  const [startHour, setStartHour] = useState(0);
  const [endHour, setEndHour] = useState(24);
  const [trips, setTrips] = useState([]);
  const [displayedTrips, setDisplayedTrips] = useState([]);

  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const token = await getAccessToken();
        const response = await axios.get(
          'https://tdx.transportdata.tw/api/basic/v2/Rail/THSR/Station',
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { $format: 'JSON' }
          }
        );
        setStations(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, []);

  const getAccessToken = async () => {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', 'B11217015-550bb110-2c3a-40e6');
    params.append('client_secret', 'cfc8aeaf-4bed-477f-9446-f5cee7176bdf');

    const response = await axios.post(
      'https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token',
      params
    );
    return response.data.access_token;
  };

  const fetchTrips = async () => {
    if (!selectedStartStation || !selectedEndStation || !selectedDate) return;

    try {
      const token = await getAccessToken();
      const response = await axios.get(
        `https://tdx.transportdata.tw/api/basic/v2/Rail/THSR/DailyTimetable/OD/${selectedStartStation}/to/${selectedEndStation}/${selectedDate}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { $format: 'JSON' }
        }
      );
      setTrips(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFare = async () => {
    if (!selectedStartStation || !selectedEndStation) return;

    try {
      const token = await getAccessToken();
      const response = await axios.get(
        `https://tdx.transportdata.tw/api/basic/v2/Rail/THSR/ODFare/${selectedStartStation}/to/${selectedEndStation}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { $format: 'JSON' }
        }
      );

      const fareData = response.data?.[0]?.Fares.find(
        f => f.FareClass === 1 && f.CabinClass === 1
      );

      if (fareData) {
        setFare(fareData.Price);
      } else {
        setFare(null);
      }
    } catch (err) {
      console.error('票價查詢失敗:', err);
    }
  };

  useEffect(() => {
    fetchFare();
    fetchTrips();
  }, [selectedStartStation, selectedEndStation, selectedDate]);

  useEffect(() => {
    const filteredTrips = trips.filter((trip) => {
      const hour = parseInt(trip.OriginStopTime?.DepartureTime?.split(':')[0]);
      return hour >= startHour && hour < endHour;
    });
    setDisplayedTrips(filteredTrips);
  }, [trips, startHour, endHour]);

  return (
    <div className="flex flex-col min-h-screen bg-[#2e2b27] text-[#e6d5b8] font-['Special_Elite',_monospace] leading-[1.7] p-4">
      <header className="text-center px-[10px] py-[10px] border-b-[3px] border-[#e6d5b8] tracking-[0.15em] mb-6">
        <h1 className="text-[3rem] text-[#f8f1e7] [text-shadow:2px_2px_5px_#000000aa]">高鐵資訊</h1>
        <p className="mb-0 text-[1.2rem] text-[#d6c9b1] italic">-------------</p>
      </header>

      <Menu />
      {loading ? (
        <p className="text-gray-900 p-4">資料載入中...</p>
      ) : (
        <div className="container mx-auto p-4 text-gray-900">
          <main className="bg-[#2e2b27] text-[#e6d5b8] leading-[1.7] min-h-screen font-['Special_Elite',_monospace] bg-[length:40px_40px]">
            <section className="mb-6 border p-4 rounded shadow">
              <h2 className="text-xl text-[#c4a35a] font-bold mb-4">起訖站查詢</h2>

              <div className="max-w-4xl mx-auto mb-8 space-y-6">

                {/* 日期選擇 */}
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={today}
                  className="flex-1 border rounded px-3 py-2 text-gray-700"
                />

                {/* 起終點車站下拉 */}
                <div className="flex space-x-6">
                  <div className="w-1/2">
                    <label className="block mb-1 text-white font-medium">起點車站：</label>
                    <select
                      value={selectedStartStation}
                      onChange={(e) => setSelectedStartStation(e.target.value)}
                      className="w-full border rounded px-3 py-2 text-gray-700"
                    >
                      <option value="">請選擇</option>
                      {stations.map((station) => (
                        <option key={station.StationID} value={station.StationID}>
                          {station.StationName.Zh_tw}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-1/2">
                    <label className="block mb-1 text-white font-medium">終點車站：</label>
                    <select
                      value={selectedEndStation}
                      onChange={(e) => setSelectedEndStation(e.target.value)}
                      className="w-full border rounded px-3 py-2 text-gray-700"
                    >
                      <option value="">請選擇</option>
                      {stations.map((station) => (
                        <option key={station.StationID} value={station.StationID}>
                          {station.StationName.Zh_tw}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 票價顯示 */}
                {fare !== null && (
                  <div className="mt-4 text-lg font-semibold text-[#c4a35a]">
                    標準車廂對號座票價：
                    <span className="text-white ml-2">{fare.toLocaleString()} 元</span>
                  </div>
                )}

                {/* 時段選擇 */}
                <div className="flex space-x-4 items-center mt-4">
                  <label className="text-white font-medium">起始時段</label>
                  <select value={startHour} onChange={(e) => setStartHour(Number(e.target.value))} className="border rounded px-2 py-1 text-gray-700">
                    {[...Array(24).keys()].map(h => (
                      <option key={h} value={h}>{h}點</option>
                    ))}
                  </select>

                  <label className="text-white font-medium">結束時段</label>
                  <select value={endHour} onChange={(e) => setEndHour(Number(e.target.value))} className="border rounded px-2 py-1 text-gray-700">
                    {[...Array(24).keys()].map(h => (
                      <option key={h} value={h}>{h}點</option>
                    ))}
                  </select>
                </div>

                {/* 班次資料表格 */}
                <table className="table-auto w-full border-collapse border border-gray-400 mt-6 text-sm">
                  <thead>
                    <tr className="bg-[#4a423f] text-white">
                      <th className="border border-gray-300 px-2 py-1">車次</th>
                      <th className="border border-gray-300 px-2 py-1">出發時間</th>
                      <th className="border border-gray-300 px-2 py-1">到達時間</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedTrips.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="text-center text-gray-300 py-4">查無班次資料</td>
                      </tr>
                    ) : (
                      displayedTrips.map((trip) => (
                        <tr key={trip.DailyTrainInfo.TrainNo} className="odd:bg-[#3a3631] even:bg-[#3e3b37]">
                          <td className="border border-gray-300 px-2 py-1 text-white text-center">{trip.DailyTrainInfo.TrainNo}</td>
                          <td className="border border-gray-300 px-2 py-1 text-white text-center">{trip.OriginStopTime.DepartureTime}</td>
                          <td className="border border-gray-300 px-2 py-1 text-white text-center">{trip.DestinationStopTime.ArrivalTime}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        </div>
      )}
      <Member />
    </div>
  );
}

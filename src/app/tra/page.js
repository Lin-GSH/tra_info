'use client';
import Menu from "@/components/Menu";
import Member from "@/components/Member";
import { useEffect, useState, useRef } from "react";
import axios from 'axios';

const cities = [
  "基隆市", "新北市", "臺北市",
  "桃園市", "新竹縣", "新竹市",
  "苗栗縣", "臺中市", "彰化縣", "南投縣",
  "雲林縣", "嘉義縣", "嘉義市",
  "臺南市", "高雄市", "屏東縣",
  "臺東縣", "花蓮縣", "宜蘭縣"
];

export default function Home() {
  // 資料狀態
  const [stations, setStations] = useState([]);
  const [filteredStationsStart, setFilteredStationsStart] = useState([]);
  const [filteredStationsEnd, setFilteredStationsEnd] = useState([]);
  const [loading, setLoading] = useState(true);

  // 選擇狀態
  const [selectedStartCity, setSelectedStartCity] = useState('');
  const [selectedStartStation, setSelectedStartStation] = useState('');
  const [selectedEndCity, setSelectedEndCity] = useState('');
  const [selectedEndStation, setSelectedEndStation] = useState('');

  // 抓到的班次資料
  const [tripInfo, setTripInfo] = useState([]);

  // 取得 AccessToken
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

  // 取得所有車站
  const fetchStation = async () => {
    try {
      const token = await getAccessToken();
      const response = await axios.get(
        'https://tdx.transportdata.tw/api/basic/v2/Rail/TRA/Station',
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { $format: 'JSON' },
        }
      );
      setStations(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStation();
  }, []);

  // 起點城市改變時
  const handleStartCityChange = (e) => {
    const city = e.target.value;
    setSelectedStartCity(city);
    setSelectedStartStation('');
    const filtered = stations.filter(s => s.LocationCity === city);
    setFilteredStationsStart(filtered);
  };

  // 起點車站改變
  const handleStartStationChange = (e) => {
    setSelectedStartStation(e.target.value);
  };

  // 終點城市改變時
  const handleEndCityChange = (e) => {
    const city = e.target.value;
    setSelectedEndCity(city);
    setSelectedEndStation('');
    const filtered = stations.filter(s => s.LocationCity === city);
    setFilteredStationsEnd(filtered);
  };

  // 終點車站改變
  const handleEndStationChange = (e) => {
    setSelectedEndStation(e.target.value);
  };

  // 抓每日班次
  const fetchTripInfo = async () => {
  if (!selectedStartStation || !selectedEndStation) return;

  try {
    const token = await getAccessToken();
    const today = new Date().toISOString().split('T')[0]; // yyyy-mm-dd

    const url = `https://tdx.transportdata.tw/api/basic/v2/Rail/TRA/DailyTimetable/OD/${selectedStartStation}/to/${selectedEndStation}/${today}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        $format: 'JSON'
      }
    });

    setTripInfo(response.data);
  } catch (err) {
    console.error("無法取得列車時刻：", err);
    setTripInfo([]); // fallback
  }
};

  // 監聽起點與終點車站變化，抓班次
  useEffect(() => {
    if (selectedStartStation && selectedEndStation) {
      fetchTripInfo(selectedStartStation.StationID, selectedEndStation.StationID);
    } else {
      setTripInfo([]);
    }
  }, [selectedStartStation, selectedEndStation]);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="bg-[#2e2b27] text-[#e6d5b8] leading-[1.7] min-h-screen font-['Special_Elite',_monospace] bg-[length:40px_40px] p-4">
        <header className="text-center px-[10px] py-[10px] border-b-[3px] border-[#e6d5b8] tracking-[0.15em] mb-6">
          <h1 className="text-[3rem] text-[#f8f1e7] [text-shadow:2px_2px_5px_#000000aa]">台鐵資訊</h1>
          <p className="mb-0 text-[1.2rem] text-[#d6c9b1] italic">被火車耽誤的便當店</p>
        </header>

        <Menu />

        {loading ? (
          <p className="text-white p-4">資料載入中...</p>
        ) : (
          <div className="w-full max-w-4xl mx-auto flex space-x-6 mb-8">
            {/* 起點選擇 */}
            <div className="w-1/2">
              <div className="flex items-center space-x-2 mb-2">
                <label htmlFor="start-city" className="text-white whitespace-nowrap font-medium">
                  起點城市：
                </label>
                <select
                  id="start-city"
                  value={selectedStartCity}
                  onChange={handleStartCityChange}
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-gray-700"
                >
                  <option value="">請選擇</option>
                  {cities.map((city, idx) => (
                    <option key={idx} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {selectedStartCity && (
                <div className="flex items-center space-x-2">
                  <label htmlFor="start-station" className="text-white whitespace-nowrap font-medium">
                    起點車站：
                  </label>
                  <select
                    id="start-station"
                    value={selectedStartStation}
                    onChange={handleStartStationChange}
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-gray-700"
                  >
                    <option value="">請選擇</option>
                    {filteredStationsStart.map((station) => (
                      <option key={station.StationID} value={station.StationID}>
                        {station.StationName.Zh_tw}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 終點選擇 */}
            <div className="w-1/2">
              <div className="flex items-center space-x-2 mb-2">
                <label htmlFor="end-city" className="text-white whitespace-nowrap font-medium">
                  終點城市：
                </label>
                <select
                  id="end-city"
                  value={selectedEndCity}
                  onChange={handleEndCityChange}
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-gray-700"
                >
                  <option value="">請選擇</option>
                  {cities.map((city, idx) => (
                    <option key={idx} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {selectedEndCity && (
                <div className="flex items-center space-x-2">
                  <label htmlFor="end-station" className="text-white whitespace-nowrap font-medium">
                    終點車站：
                  </label>
                  <select
                    id="end-station"
                    value={selectedEndStation}
                    onChange={handleEndStationChange}
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-gray-700"
                  >
                    <option value="">請選擇</option>
                    {filteredStationsEnd.map((station) => (
                      <option key={station.StationID} value={station.StationID}>
                        {station.StationName.Zh_tw}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 顯示列車時刻 */}
        {tripInfo.length > 0 && (
          <div className="max-w-4xl mx-auto bg-white text-black rounded p-4 shadow">
            <h2 className="text-xl font-bold mb-4">今日列車時刻</h2>
            <table className="w-full table-auto border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 p-2">車次</th>
                  <th className="border border-gray-300 p-2">起點時間</th>
                  <th className="border border-gray-300 p-2">終點時間</th>
                  <th className="border border-gray-300 p-2">備註</th>
                </tr>
              </thead>
              <tbody>
                {tripInfo.map((trip) => (
                  <tr key={`${trip.DailyTrainInfo?.TrainNo}-${trip.OriginStopTime?.DepartureTime}`}>
                    <td className="border border-gray-300 p-2">
                      {trip.DailyTrainInfo?.TrainNo
                        ? `${trip.DailyTrainInfo.TrainNo} [${trip.DailyTrainInfo.TrainTypeName?.Zh_tw || ''}]`
                        : '-'}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {trip.OriginStopTime?.DepartureTime || '-'}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {trip.DestinationStopTime?.ArrivalTime || '-'}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {trip.DailyTrainInfo?.Note?.Zh_tw || '-'}
                    </td>
                  </tr>
                ))}

              </tbody>
            </table>
          </div>
        )}

      </main>
      <Member />
    </div>
  );
}

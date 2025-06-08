'use client';
import Menu from "@/components/Menu";
import Member from "@/components/Member";
import { useEffect, useState } from "react";
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
  // 新增查詢模式狀態，預設為「起訖站查詢」
  const [queryMode, setQueryMode] = useState('od'); // od, trainNo, trainLive

  const [stations, setStations] = useState([]);
  const [filteredStationsStart, setFilteredStationsStart] = useState([]);
  const [filteredStationsEnd, setFilteredStationsEnd] = useState([]);
  const [loading, setLoading] = useState(true);

  // 起訖站查詢相關
  const [selectedStartCity, setSelectedStartCity] = useState('');
  const [selectedStartStation, setSelectedStartStation] = useState('');
  const [selectedEndCity, setSelectedEndCity] = useState('');
  const [selectedEndStation, setSelectedEndStation] = useState('');

  // 共用日期
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);

  // 時段 (只對起訖站查詢有效)
  const [startHour, setStartHour] = useState("0");
  const [endHour, setEndHour] = useState("23");

  // 車次查詢 & 單一列車動態 查詢車次號碼
  const [trainNo, setTrainNo] = useState('');

  // 查詢結果資料
  const [tripInfo, setTripInfo] = useState([]);
  const [fareInfo, setFareInfo] = useState([]);
  const [delayInfo, setDelayInfo] = useState([]);
  const [stops, setStops] = useState([]); // 單一列車動態的停靠站資料
  const [error, setError] = useState(null);

  // === 以下為原本的取得 AccessToken 與 API fetch 函數 ===
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

  // 取得車站資料
  const fetchStation = async () => {
    try {
      const token = await getAccessToken();
      const response = await axios.get(
        `https://tdx.transportdata.tw/api/basic/v2/Rail/TRA/Station`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { $format: 'JSON' }
        });
      setStations(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 起訖站查詢：列車時刻
  const fetchTripInfoOD = async () => {
    if (!selectedStartStation || !selectedEndStation || !selectedDate) return;

    try {
      const token = await getAccessToken();
      const url = `https://tdx.transportdata.tw/api/basic/v2/Rail/TRA/DailyTimetable/OD/${selectedStartStation}/to/${selectedEndStation}/${selectedDate}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params: { $format: 'JSON' }
      });
      setTripInfo(response.data);
    } catch (err) {
      console.error("無法取得列車時刻：", err);
      setTripInfo([]);
    }
  };

  // 起訖站查詢：票價資料
  const fetchFareInfoOD = async () => {
    if (!selectedStartStation || !selectedEndStation) return;

    try {
      const token = await getAccessToken();
      const url = `https://tdx.transportdata.tw/api/basic/v2/Rail/TRA/ODFare/${selectedStartStation}/to/${selectedEndStation}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params: { $format: 'JSON' }
      });

      if (response.data.length > 0) {
        setFareInfo(response.data[0].Fares);
      } else {
        setFareInfo([]);
      }
    } catch (err) {
      console.error("票價取得失敗：", err);
      setFareInfo([]);
    }
  };

  // 起訖站查詢：誤點資料
  const fetchDelayInfoOD = async () => {
    if (!selectedDate) return;

    try {
      const token = await getAccessToken();
      const url = `https://tdx.transportdata.tw/api/basic/v2/Rail/TRA/LiveTrainDelay`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params: { $format: 'JSON' }
      });

      setDelayInfo(response.data);
    } catch (err) {
      console.error("誤點資料取得失敗：", err);
      setDelayInfo([]);
    }
  };

  // 起始城市改變過濾車站
  const handleStartCityChange = (e) => {
    const city = e.target.value;
    setSelectedStartCity(city);
    setSelectedStartStation('');
    const filtered = stations.filter(s => s.LocationCity === city);
    setFilteredStationsStart(filtered);
  };

  // 終點城市改變過濾車站
  const handleEndCityChange = (e) => {
    const city = e.target.value;
    setSelectedEndCity(city);
    setSelectedEndStation('');
    const filtered = stations.filter(s => s.LocationCity === city);
    setFilteredStationsEnd(filtered);
  };

  // 起訖站切換過濾
  const handleStartStationChange = (e) => setSelectedStartStation(e.target.value);
  const handleEndStationChange = (e) => setSelectedEndStation(e.target.value);

  // 車次輸入
  const handleTrainNoChange = (e) => setTrainNo(e.target.value);

  // 日期改變
  const handleDateChange = (e) => setSelectedDate(e.target.value);

  // 時間區間改變（起訖站專用）
  const handleStartHourChange = (e) => setStartHour(e.target.value);
  const handleEndHourChange = (e) => setEndHour(e.target.value);

  // 篩選班次依時間區間（只對起訖站查詢）
  const filterTripsByTime = (trips, startH, endH) => {
    const startHourNum = Number(startH);
    const endHourNum = Number(endH);
    return trips.filter(trip => {
      const depTime = trip.OriginStopTime?.DepartureTime || '';
      if (!depTime) return false;
      const depHour = Number(depTime.split(':')[0]);
      return depHour >= startHourNum && depHour <= endHourNum;
    });
  };

  // 根據車種名稱找成人票票價
  const getFareByTrainType = (trainTypeNameZh, fares) => {
    if (!trainTypeNameZh || !Array.isArray(fares)) return '-';

    let ticketTypeKey = '';

    if (trainTypeNameZh.includes('自強')) ticketTypeKey = '成自';
    else if (trainTypeNameZh.includes('莒光')) ticketTypeKey = '成莒';
    else if (trainTypeNameZh.includes('復興')) ticketTypeKey = '成復';
    else if (
      trainTypeNameZh.includes('區間') ||
      trainTypeNameZh.includes('普通') ||
      trainTypeNameZh.includes('復')  // 防止寫成「復」但實為區間
    ) ticketTypeKey = '成復';

    const fareItem = fares.find(f => f.TicketType === ticketTypeKey);
    return fareItem ? `${fareItem.Price} 元` : '-';
  };

  // 根據車次找誤點狀態
  const getDelayByTrainNo = (trainNo) => {
    if (!trainNo || !delayInfo || delayInfo.length === 0) return '-';
    const delayRecord = delayInfo.find(d => d.TrainNo === trainNo);
    if (!delayRecord) return '準時';

    if (delayRecord.Cancelled === true) return '取消';
    if (delayRecord.DelayTime && delayRecord.DelayTime > 0) {
      return `誤點 ${delayRecord.DelayTime} 分鐘`;
    }
    return '準時';
  };

const fetchTripInfoTrainNo = async (trainNo) => {
  setLoading(true);
  setError(null);
  try {
    const token = await getAccessToken();
    const url = `https://tdx.transportdata.tw/api/basic/v2/Rail/TRA/GeneralTimetable/TrainNo/${trainNo}`;

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      params: { $format: 'JSON' },
    });

    if (response.data.length > 0) {
      const stops = response.data[0].GeneralTimetable.StopTimes || [];
      setStops(stops);
    } else {
      setStops([]);
      setError('查無該車次資料');
    }
  } catch (err) {
    console.error("查詢失敗：", err);
    setError('查詢失敗，請稍後再試');
    setStops([]);
  } finally {
    setLoading(false);
  }
};

  // 監聽 fetch，依 queryMode 呼叫不同函數
  useEffect(() => {
    fetchStation();
  }, []);

  useEffect(() => {
    if (queryMode === 'od') {
      if (selectedStartStation && selectedEndStation && selectedDate) {
        fetchTripInfoOD();
        fetchFareInfoOD();
        fetchDelayInfoOD();
      } else {
        setTripInfo([]);
        setFareInfo([]);
        setDelayInfo([]);
      }
    } else if (queryMode === 'trainNo') {
      if (trainNo && selectedDate) {
      } else {
      }
    } else if (queryMode === 'trainLive') {
      if (trainNo) {
      } else {
      }
    }
  }, [queryMode, selectedStartStation, selectedEndStation, selectedDate, trainNo]);

  const displayedTrips = filterTripsByTime(tripInfo, startHour, endHour);

  return (
    <div className="flex flex-col min-h-screen bg-[#2e2b27] text-[#e6d5b8] font-['Special_Elite',_monospace] leading-[1.7] p-4">
      <header className="text-center px-[10px] py-[10px] border-b-[3px] border-[#e6d5b8] tracking-[0.15em] mb-6">
        <h1 className="text-[3rem] text-[#f8f1e7] [text-shadow:2px_2px_5px_#000000aa]">台鐵資訊</h1>
        <p className="mb-0 text-[1.2rem] text-[#d6c9b1] italic">被火車耽誤的便當店</p>
      </header>

      <Menu />
      {loading ? (
        <p className="text-gray-900 p-4">資料載入中...</p>
      ) : (
              <div className="container mx-auto p-4 text-gray-900">
              {/* 查詢模式切換 */}
                <div className="mb-4 flex space-x-4">
                  <button
                    className={`px-4 py-2 rounded ${
                      queryMode === 'od' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900'
                    }`}
                    onClick={() => setQueryMode('od')}
                  >
                    起訖站查詢
                  </button>
                  <button
                    className={`px-4 py-2 rounded ${
                      queryMode === 'trainNo' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900'
                    }`}
                    onClick={() => setQueryMode('trainNo')}
                  >
                    車次查詢
                  </button>
                </div>

              {/* 不同查詢模式的表單 */}
              {queryMode === 'od' && (
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

                    {/* 起點城市與車站 */}
                    <div className="flex space-x-6">
                      <div className="w-1/2">
                        <label className="block mb-1 text-white font-medium" htmlFor="start-city">起點城市：</label>
                        <select
                          id="start-city"
                          value={selectedStartCity}
                          onChange={handleStartCityChange}
                          className="w-full border rounded px-3 py-2 text-gray-700"
                        >
                          <option value="">請選擇</option>
                          {cities.map((city, idx) => (
                            <option key={idx} value={city}>{city}</option>
                          ))}
                        </select>

                        {selectedStartCity && (
                          <div>
                            <label className="block mt-4 mb-1 text-white font-medium" htmlFor="start-station">起點車站：</label>
                            <select
                              id="start-station"
                              value={selectedStartStation}
                              onChange={handleStartStationChange}
                              className="w-full border rounded px-3 py-2 text-gray-700"
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

                      {/* 終點城市與車站 */}
                      <div className="w-1/2">
                        <label className="block mb-1 text-white font-medium" htmlFor="end-city">終點城市：</label>
                        <select
                          id="end-city"
                          value={selectedEndCity}
                          onChange={handleEndCityChange}
                          className="w-full border rounded px-3 py-2 text-gray-700"
                        >
                          <option value="">請選擇</option>
                          {cities.map((city, idx) => (
                            <option key={idx} value={city}>{city}</option>
                          ))}
                        </select>

                        {selectedEndCity && (
                          <div>
                            <label className="block mt-4 mb-1 text-white font-medium" htmlFor="end-station">終點車站：</label>
                            <select
                              id="end-station"
                              value={selectedEndStation}
                              onChange={handleEndStationChange}
                              className="w-full border rounded px-3 py-2 text-gray-700"
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

                    {/* 時間區間篩選 */}
                    <div className="flex space-x-4 mt-4 items-center">
                      <label className="text-white font-medium">起始時段</label>
                      <select value={startHour} onChange={handleStartHourChange} className="border rounded px-2 py-1 text-gray-700">
                        {[...Array(24).keys()].map(h => (
                          <option key={h} value={h}>{h}點</option>
                        ))}
                      </select>

                      <label className="text-white font-medium">結束時段</label>
                      <select value={endHour} onChange={handleEndHourChange} className="border rounded px-2 py-1 text-gray-700">
                        {[...Array(24).keys()].map(h => (
                          <option key={h} value={h}>{h}點</option>
                        ))}
                      </select>
                    </div>

                    {/* 列車時刻表 */}
                    <table className="table-auto w-full border-collapse border border-gray-400 mt-6 text-sm">
                      <thead>
                        <tr className="bg-[#4a423f] text-white">
                          <th className="border border-gray-300 px-2 py-1">車次</th>
                          <th className="border border-gray-300 px-2 py-1">車種</th>
                          <th className="border border-gray-300 px-2 py-1">出發時間</th>
                          <th className="border border-gray-300 px-2 py-1">到達時間</th>
                          <th className="border border-gray-300 px-2 py-1">成人票價</th>
                          <th className="border border-gray-300 px-2 py-1">誤點狀態</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedTrips.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="text-center text-gray-300 py-4">查無班次資料</td>
                          </tr>
                        ) : (
                          displayedTrips.map((trip) => (
                            <tr key={trip.DailyTrainInfo?.TrainNo} className="odd:bg-[#3a3631] even:bg-[#3e3b37]">
                              <td className="border border-gray-300 px-2 py-1 text-white text-center">{trip.DailyTrainInfo?.TrainNo || '-'}</td>
                              <td className="border border-gray-300 px-2 py-1 text-white text-center">{trip.DailyTrainInfo?.TrainTypeName?.Zh_tw || '-'}</td>
                              <td className="border border-gray-300 px-2 py-1 text-white text-center">{trip.OriginStopTime?.DepartureTime || '-'}</td>
                              <td className="border border-gray-300 px-2 py-1 text-white text-center">{trip.DestinationStopTime?.ArrivalTime || '-'}</td>
                              <td className="border border-gray-300 px-2 py-1 text-white text-center">{getFareByTrainType(trip.DailyTrainInfo?.TrainTypeName?.Zh_tw, fareInfo)}</td>
                              <td className="border border-gray-300 px-2 py-1 text-white text-center">{getDelayByTrainNo(trip.DailyTrainInfo?.TrainNo)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {queryMode === 'trainNo' && (
                <section className="mb-6 border p-4 rounded shadow">
                  <h2 className="text-xl text-[#c4a35a] font-bold mb-4">車次查詢</h2>
                  <div className="max-w-4xl mx-auto mb-8 space-y-6">

                    {/* 輸入車次 */}
                    <div className="flex space-x-4 items-center">
                      <input
                        type="text"
                        placeholder="輸入車次號碼"
                        value={trainNo}
                        onChange={(e) => setTrainNo(e.target.value)}
                        className="flex-1 border rounded px-3 py-2 text-gray-800"
                      />
                      <button
                        onClick={() => fetchTripInfoTrainNo(trainNo)}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                      >
                        {loading ? '查詢中...' : '查詢'}
                      </button>
                    </div>

                    {/* 錯誤訊息 */}
                    {error && (
                      <p className="text-red-400">{error}</p>
                    )}

                    {/* 停靠站資料表格 */}
                    {stops.length > 0 && (
                      <table className="table-auto w-full border-collapse border border-gray-400 mt-4 text-sm">
                        <thead>
                          <tr className="bg-[#4a423f] text-white">
                            <th className="border border-gray-300 px-2 py-1">停靠站</th>
                            <th className="border border-gray-300 px-2 py-1">到站時間</th>
                            <th className="border border-gray-300 px-2 py-1">開車時間</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stops.map((stop, i) => (
                            <tr key={i} className="odd:bg-[#3a3631] even:bg-[#3e3b37]">
                              <td className="border border-gray-300 px-2 py-1 text-white text-center">{stop.StationName?.Zh_tw || '-'}</td>
                              <td className="border border-gray-300 px-2 py-1 text-white text-center">{stop.ArrivalTime || '—'}</td>
                              <td className="border border-gray-300 px-2 py-1 text-white text-center">{stop.DepartureTime || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </section>
              )}

              
            </div>
          )}



        <Member /></div>
  );
}
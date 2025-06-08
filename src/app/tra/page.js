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
  const [stations, setStations] = useState([]);
  const [filteredStationsStart, setFilteredStationsStart] = useState([]);
  const [filteredStationsEnd, setFilteredStationsEnd] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedStartCity, setSelectedStartCity] = useState('');
  const [selectedStartStation, setSelectedStartStation] = useState('');
  const [selectedEndCity, setSelectedEndCity] = useState('');
  const [selectedEndStation, setSelectedEndStation] = useState('');

  const [tripInfo, setTripInfo] = useState([]);
  const [fareInfo, setFareInfo] = useState([]);
  const [delayInfo, setDelayInfo] = useState([]); // 新增誤點狀態資料

  const [startHour, setStartHour] = useState("0");
  const [endHour, setEndHour] = useState("23");

  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);

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

  // 取得車站資料
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

  // 取得列車時刻
  const fetchTripInfo = async () => {
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

  // 取得票價資料
  const fetchFareInfo = async () => {
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

  // 取得誤點資訊
  const fetchDelayInfo = async () => {
    if (!selectedDate) return;

    try {
      const token = await getAccessToken();
      // 這個 API 可以查詢特定日期誤點狀態
      // 會回傳該日所有列車的誤點資訊
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

  // 篩選班次依時間區間（整點）
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

  useEffect(() => {
    fetchStation();
  }, []);

  useEffect(() => {
    if (selectedStartStation && selectedEndStation && selectedDate) {
      fetchTripInfo();
      fetchFareInfo();
      fetchDelayInfo();
    } else {
      setTripInfo([]);
      setFareInfo([]);
      setDelayInfo([]);
    }
  }, [selectedStartStation, selectedEndStation, selectedDate]);

  const handleStartCityChange = (e) => {
    const city = e.target.value;
    setSelectedStartCity(city);
    setSelectedStartStation('');
    const filtered = stations.filter(s => s.LocationCity === city);
    setFilteredStationsStart(filtered);
  };

  const handleStartStationChange = (e) => {
    setSelectedStartStation(e.target.value);
  };

  const handleEndCityChange = (e) => {
    const city = e.target.value;
    setSelectedEndCity(city);
    setSelectedEndStation('');
    const filtered = stations.filter(s => s.LocationCity === city);
    setFilteredStationsEnd(filtered);
  };

  const handleEndStationChange = (e) => {
    setSelectedEndStation(e.target.value);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleStartHourChange = (e) => {
    setStartHour(e.target.value);
  };

  const handleEndHourChange = (e) => {
    setEndHour(e.target.value);
  };

  const displayedTrips = filterTripsByTime(tripInfo, startHour, endHour);

  return (
    <div className="flex flex-col min-h-screen bg-[#2e2b27] text-[#e6d5b8] font-['Special_Elite',_monospace] leading-[1.7] p-4">
      <header className="text-center px-[10px] py-[10px] border-b-[3px] border-[#e6d5b8] tracking-[0.15em] mb-6">
        <h1 className="text-[3rem] text-[#f8f1e7] [text-shadow:2px_2px_5px_#000000aa]">台鐵資訊</h1>
        <p className="mb-0 text-[1.2rem] text-[#d6c9b1] italic">被火車耽誤的便當店</p>
      </header>

      <Menu />

      {loading ? (
        <p className="text-white p-4">資料載入中...</p>
      ) : (
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
                <>
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
                </>
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
                <>
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
                </>
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
                <th className="border border-gray-300 px-2 py-1">誤點狀態</th> {/* 新增欄位 */}
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
                    <td className="border border-gray-300 px-2 py-1 text-center">{trip.DailyTrainInfo?.TrainNo || '-'}</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">{trip.DailyTrainInfo?.TrainTypeName?.Zh_tw || '-'}</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">{trip.OriginStopTime?.DepartureTime || '-'}</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">{trip.DestinationStopTime?.ArrivalTime || '-'}</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">{getFareByTrainType(trip.DailyTrainInfo?.TrainTypeName?.Zh_tw, fareInfo)}</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">{getDelayByTrainNo(trip.DailyTrainInfo?.TrainNo)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Member />
    </div>
  );
}

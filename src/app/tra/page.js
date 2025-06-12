'use client';
import Menu from "@/components/Menu";
import Member from "@/components/Member";
import { useEffect, useState } from "react";
import axios from 'axios';
import React from "react";

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
  const [queryMode, setQueryMode] = useState('od'); // od, trainNo, transfer

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
  
  // 車種過濾
  const [trainTypeFilter, setTrainTypeFilter] = useState('all');

  // 車次查詢 & 單一列車動態 查詢車次號碼
  const [trainNo, setTrainNo] = useState('');

  // 轉乘查詢相關
  const [transferStartCity, setTransferStartCity] = useState('');
  const [transferStartStation, setTransferStartStation] = useState('');
  const [transferEndCity, setTransferEndCity] = useState('');
  const [transferEndStation, setTransferEndStation] = useState('');
  const [transferResults, setTransferResults] = useState([]);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState(null);
  
  // 查詢結果資料
  const [tripInfo, setTripInfo] = useState([]);
  const [fareInfo, setFareInfo] = useState([]);
  const [delayInfo, setDelayInfo] = useState([]);
  const [stops, setStops] = useState([]); // 單一列車動態的停靠站資料
  const [trainType, setTrainType] = useState(''); // 儲存車種資訊
  const [error, setError] = useState(null);

  // === 以下為原本的取得 AccessToken 與 API fetch 函數 ===
  const getAccessToken = async () => {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', 'b11217022-5a55899f-321d-4949');//'B11217015-550bb110-2c3a-40e6'
    params.append('client_secret', 'fccbdb54-96d8-41a0-8ae3-d4f0128d8826');//'cfc8aeaf-4bed-477f-9446-f5cee7176bdf'

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

  // 時間區間改變（起訖站專用）
  const handleStartHourChange = (e) => setStartHour(e.target.value);
  const handleEndHourChange = (e) => setEndHour(e.target.value);

  // 篩選班次依時間區間和車種（只對起訖站查詢）
  const filterTripsByTimeAndType = (trips, startH, endH, trainType) => {
    const startHourNum = Number(startH);
    const endHourNum = Number(endH);
    return trips.filter(trip => {
      // 時間過濾
      const depTime = trip.OriginStopTime?.DepartureTime || '';
      if (!depTime) return false;
      const depHour = Number(depTime.split(':')[0]);
      const timeMatch = depHour >= startHourNum && depHour <= endHourNum;

      // 車種過濾
      const trainTypeName = trip.DailyTrainInfo?.TrainTypeName?.Zh_tw || '';
      const typeMatch = trainType === 'all' || 
                       (trainType === 'express' && (trainTypeName.includes('自強') || trainTypeName.includes('莒光'))) ||
                       (trainType === 'local' && trainTypeName.includes('區間'));

      return timeMatch && typeMatch;
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

  const findTransferRoutes = async () => {
    if (!transferStartStation || !transferEndStation || !selectedDate) return;

    setTransferLoading(true);
    setTransferError(null);
    setTransferResults([]);

    try {
      const token = await getAccessToken();

      const startStation = stations.find(s => s.StationID === transferStartStation);
      const endStation = stations.find(s => s.StationID === transferEndStation);
      console.log("起點站:", startStation);
      console.log("終點站:", endStation);

      const filteredStations = stations.filter(station => {
      
      const isMainStation = station.StationClass === "1" || station.StationClass === "0" ;
        if (!isMainStation) return false;

        const stationKm = parseFloat(station.StationID) || 0;
        const startKm = parseFloat(startStation?.StationID) || 0;
        const endKm = parseFloat(endStation?.StationID) || 0;

        const isBetween = stationKm >= Math.min(startKm, endKm) &&
                          stationKm <= Math.max(startKm, endKm);

        return isBetween;
      });

      let minStation = null;
      let maxStation = null;

      for (const station of filteredStations) {
        const km = parseFloat(station.StationID);
        if (!minStation || km < parseFloat(minStation.StationID)) {
          minStation = station;
        }
        if (!maxStation || km > parseFloat(maxStation.StationID)) {
          maxStation = station;
        }
      }

      const potentialTransferStations = [];
      if (minStation) potentialTransferStations.push(minStation);
      if (maxStation && maxStation !== minStation) potentialTransferStations.push(maxStation);
      console.log("潛在轉乘站:", potentialTransferStations);

      const transferFirstID = (startStation.StationID < endStation.StationID) ? potentialTransferStations[0].StationID : potentialTransferStations[1].StationID;
      const transferSecondID = (startStation.StationID < endStation.StationID) ? potentialTransferStations[1].StationID : potentialTransferStations[0].StationID;

      const [firstLegRes, secondLegRes, thirdLegRes, straightRes] = await Promise.all([
        axios.get(`https://tdx.transportdata.tw/api/basic/v2/Rail/TRA/DailyTimetable/OD/${transferStartStation}/to/${transferFirstID}/${selectedDate}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { $format: 'JSON' }
        }),
        axios.get(`https://tdx.transportdata.tw/api/basic/v2/Rail/TRA/DailyTimetable/OD/${transferFirstID}/to/${transferSecondID}/${selectedDate}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { $format: 'JSON' }
        }),
        axios.get(`https://tdx.transportdata.tw/api/basic/v2/Rail/TRA/DailyTimetable/OD/${transferSecondID}/to/${transferEndStation}/${selectedDate}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { $format: 'JSON' }
        }),
        axios.get(`https://tdx.transportdata.tw/api/basic/v2/Rail/TRA/DailyTimetable/OD/${transferStartStation}/to/${transferEndStation}/${selectedDate}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { $format: 'JSON' }
        })
      ]);
      console.log("第一段路線:", firstLegRes.data);
      console.log("第二段路線:", secondLegRes.data);
      console.log("第三段路線:", thirdLegRes.data);
      console.log("直達路線:", straightRes.data);

      const firstLegs = firstLegRes.data.map(item => ({ ...item, leg: 1 }));
      const secondLegs = secondLegRes.data.map(item => ({ ...item, leg: 2 }));
      const thirdLegs = thirdLegRes.data.map(item => ({ ...item, leg: 3 }));
      const straightLegs = straightRes.data.map(item => ({ ...item, leg: 0 }));

      function toMinutes(timeStr) {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
      }

      function getTimeDiff(startTime, endTime) {
        let start = toMinutes(startTime);
        let end = toMinutes(endTime);

        // 如果 end < start，表示跨日了，+ 24 小時
        if (end < start) {
          return (24 * 60 - start) + end; // 跨日情況
        }

        return end - start;
      }

      

      const validRoutes = [];
      const shortestPerDeparture = new Map();

      if (transferFirstID === startStation.StationID && transferSecondID === endStation.StationID) {
        straightLegs.forEach(straight => {
          const totalTime = getTimeDiff(straight?.OriginStopTime?.DepartureTime, straight?.DestinationStopTime?.ArrivalTime);
          validRoutes.push({ straight, totalTime}); // 只有第一段
        });

        for (const route of validRoutes) {
          const depTime = route.straight?.OriginStopTime?.DepartureTime;

          if (
            !shortestPerDeparture.has(depTime) ||
            route.totalTime < shortestPerDeparture.get(depTime).totalTime
          ) {
            shortestPerDeparture.set(depTime, route);
          }
        }
      }
      else {
        let routeSelection = 0;
        // 2-3 段轉乘
        if (transferFirstID === startStation.StationID && transferSecondID !== endStation.StationID) {
          routeSelection = 2;
          secondLegs.forEach(second => {
            const secondArr = second.DestinationStopTime.ArrivalTime;

            thirdLegs.forEach(Third => {
              const thirdDep = Third.OriginStopTime.DepartureTime;
              if (second.DestinationStopTime.ArrivalTime > Third.OriginStopTime.DepartureTime) return;
              if (getTimeDiff(secondArr, thirdDep) < 5) return;

              const totalTime = getTimeDiff(second.OriginStopTime.DepartureTime, Third.DestinationStopTime.ArrivalTime);

              validRoutes.push({
                second,
                Third,
                totalTime
              });
            });
          });
        }
        // 1-2 段轉乘
        else if (transferFirstID !== startStation.StationID && transferSecondID === endStation.StationID) {
          routeSelection = 1;
          firstLegs.forEach(first => {
            const firstArr = first.DestinationStopTime.ArrivalTime;

            secondLegs.forEach(second => {
              const secondDep = second.OriginStopTime.DepartureTime;
              if (getTimeDiff(firstArr, secondDep) < 5) return;
              if (first.DestinationStopTime.ArrivalTime > second.OriginStopTime.DepartureTime) return;
              const totalTime = getTimeDiff(first.OriginStopTime.DepartureTime, second.DestinationStopTime.ArrivalTime);

              validRoutes.push({
                first,
                second,
                totalTime
              });
            });
          });
        }
        else{
          routeSelection = 3;
          let route = {};
          // ✅ 處理 2 ~ 3 段轉乘
          firstLegs.forEach(first => {
            const firstArr = first.DestinationStopTime.ArrivalTime;

            secondLegs.forEach(second => {
              const secondDep = second.OriginStopTime.DepartureTime;
              if (first.DestinationStopTime.ArrivalTime > second.OriginStopTime.DepartureTime) return;
              if (getTimeDiff(firstArr, secondDep) < 5) return;

              const secondArr = second.DestinationStopTime.ArrivalTime;

              thirdLegs.forEach(Third => {
                const thirdDep = Third.OriginStopTime.DepartureTime;
                if (second.DestinationStopTime.ArrivalTime > Third.OriginStopTime.DepartureTime) return;
                if (getTimeDiff(secondArr, thirdDep) < 5) return;

                route = {
                  first,
                  second,
                  Third,
                  totalTime: getTimeDiff(
                    first.OriginStopTime.DepartureTime,
                    Third.DestinationStopTime.ArrivalTime
                  )
                };
                validRoutes.push(route);
              });
            });
          });
        }
        console.log(validRoutes);
        for (const route of validRoutes) {
          let depTime;
          // 依據 route 的型態選取對應的出發時間作為 key
          if (route.first && route.second && route.Third) {
            // 1->2->3 三段轉乘，出發時間取第一段起點
            depTime = route.first.OriginStopTime.DepartureTime;
          } else if (route.first && route.second) {
            // 1->2 段轉乘，出發時間取第一段起點
            depTime = route.first.OriginStopTime.DepartureTime;
          } else if (route.second && route.Third) {
            // 2->3 段轉乘，出發時間取第二段起點
            depTime = route.second.OriginStopTime.DepartureTime;
          } else if (route.straight) {
            // 直達，出發時間取直達起點
            depTime = route.straight.OriginStopTime.DepartureTime;
          } else if (route.first) {
            // 單段（只有第一段）
            depTime = route.first.OriginStopTime.DepartureTime;
          } else {
            // 找不到合適的出發時間就跳過
            continue;
          }

          if (!depTime) continue;

          const key = String(depTime);

          if (
            !shortestPerDeparture.has(key) ||
            route.totalTime < shortestPerDeparture.get(key).totalTime
          ) {
            shortestPerDeparture.set(key, route);
          }
        }

      }
      // 更新狀態
      setTransferResults(Array.from(shortestPerDeparture.values()));
      console.log("轉乘查詢結果：", Array.from(shortestPerDeparture.values()));

    } catch (err) {
      console.error("轉乘查詢失敗：", err);
      setTransferError("轉乘查詢失敗，請稍後再試");
      setTransferResults([]);
    } finally {

      setTransferLoading(false);
    }
  };
  
  const fetchTripInfoTrainNo = async (trainNo) => {
    setLoading(true);
    setError(null);
    setTrainType(''); // 重置車種資訊
    try {
      const token = await getAccessToken();
      const url = `https://tdx.transportdata.tw/api/basic/v2/Rail/TRA/GeneralTimetable/TrainNo/${trainNo}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params: { $format: 'JSON' },
      });

      if (response.data.length > 0) {
        const stops = response.data[0].GeneralTimetable.StopTimes || [];
        const type = response.data[0].GeneralTimetable.GeneralTrainInfo?.TrainTypeName?.Zh_tw || '未知';
        setStops(stops);
        setTrainType(type);
      } else {
        setStops([]);
        setTrainType('');
        setError('查無該車次資料');
      }
    } catch (err) {
      console.error("查詢失敗：", err);
      setError('查詢失敗，請稍後再試');
      setStops([]);
      setTrainType('');
    } finally {
      setLoading(false);
    }
  };

  function TransferTable({ transferResults }) {
    const [expandedRows, setExpandedRows] = useState([]);

    const toggleRow = (idx) => {
      setExpandedRows((prev) =>
        prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
      );
    };

    return (
      transferResults.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-4 text-lg font-bold text-white">轉乘方案</h3>
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse border border-gray-400 text-sm">
              <thead>
                <tr className="bg-[#4a423f] text-white">
                  <th className="px-4 py-2 border border-gray-300 text-center">起點時間</th>
                  <th className="px-4 py-2 border border-gray-300 text-center">終點時間</th>
                  <th className="px-4 py-2 border border-gray-300 text-center">轉乘時間</th>
                  {/*<th className="px-4 py-2 border border-gray-300 text-center">總票價</th>*/}
                </tr>
              </thead>
              <tbody>
                {transferResults.map((route, idx) => {
                  const isExpanded = expandedRows.includes(idx);
                  const rowColor = idx % 2 === 0 ? 'bg-[#3e3b37]' : 'bg-[#3a3631]';

                  return (
                    <React.Fragment key={idx}>
                      {/* 摘要列 */}
                      <tr
                        onClick={() => toggleRow(idx)}
                        className={`cursor-pointer ${rowColor} hover:bg-[#5a524c] transition duration-200`}
                      >
                        <td className="px-4 py-2 border border-gray-300 text-white text-center">
                          {route.straight?.OriginStopTime?.DepartureTime}
                          {!route.straight && route.first?.OriginStopTime?.DepartureTime}
                          {!route.first && route.second?.OriginStopTime?.DepartureTime}
                        </td>
                        <td className="px-4 py-2 border border-gray-300 text-white text-center">
                          {route.straight?.DestinationStopTime?.ArrivalTime}
                          {(!route.straight || !route.first)&& route.Third?.DestinationStopTime?.ArrivalTime}
                          {!route.Third && route.second?.DestinationStopTime?.ArrivalTime}
                        </td>
                        <td className="px-4 py-2 border border-gray-300 text-white text-center">
                          {route.totalTime} 分鐘
                        </td>
                        {/*<td className="px-4 py-2 border border-gray-300 text-white text-center">
                          {route.Fare}元
                        </td>*/}
                      </tr>

                      {/* 詳細列 */}
                      {isExpanded && (
                        <tr className="bg-[#2f2c2a] text-white transition duration-200">
                          <td colSpan={3} className="px-6 py-4 border-t border-gray-600">
                            <div className="space-y-4 text-left">
                              {route.straight && (
                                <div>
                                  <strong>第一班車：</strong><br />
                                  {route.straight.DailyTrainInfo?.TrainNo} - {route.straight.DailyTrainInfo?.TrainTypeName?.Zh_tw}<br />
                                  {route.straight.OriginStopTime?.DepartureTime} ({route.straight.OriginStopTime?.StationName?.Zh_tw}) →
                                  {route.straight.DestinationStopTime?.ArrivalTime} ({route.straight.DestinationStopTime?.StationName?.Zh_tw})
                                </div>
                              )}
                              {!route.straight && route.first && (
                                <div>
                                  <strong>第一班車：</strong><br />
                                  {route.first.DailyTrainInfo?.TrainNo} - {route.first.DailyTrainInfo?.TrainTypeName?.Zh_tw}<br />
                                  {route.first.OriginStopTime?.DepartureTime} ({route.first.OriginStopTime?.StationName?.Zh_tw}) →
                                  {route.first.DestinationStopTime?.ArrivalTime} ({route.first.DestinationStopTime?.StationName?.Zh_tw})
                                </div>
                              )}
                              {route.second && (
                                <div>
                                  <strong>{route.first ? '第二班車：' : '第一班車：'}</strong><br />
                                  {route.second?.DailyTrainInfo?.TrainNo}-{route.second?.DailyTrainInfo?.TrainTypeName?.Zh_tw}<br />
                                  {route.second?.OriginStopTime?.DepartureTime} ({route.second?.OriginStopTime?.StationName?.Zh_tw}) → {route.second?.DestinationStopTime?.ArrivalTime} ({route.second?.DestinationStopTime?.StationName?.Zh_tw})
                                </div>
                              )}
                              {route.Third && (
                                <div>
                                  <strong>{route.first ? '第三班車：' : '第二班車：'}</strong><br />
                                  {route.Third?.DailyTrainInfo?.TrainNo}-{route.Third?.DailyTrainInfo?.TrainTypeName?.Zh_tw}<br />
                                  {route.Third?.OriginStopTime?.DepartureTime} ({route.Third?.OriginStopTime?.StationName?.Zh_tw}) → {route.Third?.DestinationStopTime?.ArrivalTime} ({route.Third?.DestinationStopTime?.StationName?.Zh_tw})
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )
    );
  }


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

  const displayedTrips = filterTripsByTimeAndType(tripInfo, startHour, endHour, trainTypeFilter);

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
              <button
                className={`px-4 py-2 rounded ${
                  queryMode === 'transfer' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900'
                }`}
                onClick={() => setQueryMode('transfer')}
              >
                轉乘查詢
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

                  <label className="text-white font-medium">車種篩選</label>
                  <select 
                    value={trainTypeFilter} 
                    onChange={(e) => setTrainTypeFilter(e.target.value)} 
                    className="border rounded px-2 py-1 text-gray-700"
                  >
                    <option value="all">全部車種</option>
                    <option value="express">自強/莒光號</option>
                    <option value="local">區間車</option>
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
                {/* 顯示車種資訊 */}
                {trainType && (
                  <div className="mt-4 mb-2 text-white">
                    <span className="font-bold">車種：</span> {trainType}
                  </div>
                )}

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

          {queryMode === 'transfer' && (
            <section className="mb-6 border p-4 rounded shadow">
              <h2 className="text-xl text-[#c4a35a] font-bold mb-4">轉乘查詢</h2>
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
                    <label className="block mb-1 text-white font-medium">起點城市：</label>
                    <select
                      value={transferStartCity}
                      onChange={(e) => {
                        setTransferStartCity(e.target.value);
                        setTransferStartStation('');
                        const filtered = stations.filter(s => s.LocationCity === e.target.value);
                        setFilteredStationsStart(filtered);
                      }}
                      className="w-full border rounded px-3 py-2 text-gray-700"
                    >
                      <option value="">請選擇</option>
                      {cities.map((city, idx) => (
                        <option key={idx} value={city}>{city}</option>
                      ))}
                    </select>

                    {transferStartCity && (
                      <div>
                        <label className="block mt-4 mb-1 text-white font-medium">起點車站：</label>
                        <select
                          value={transferStartStation}
                          onChange={(e) => setTransferStartStation(e.target.value)}
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
                    <label className="block mb-1 text-white font-medium">終點城市：</label>
                    <select
                      value={transferEndCity}
                      onChange={(e) => {
                        setTransferEndCity(e.target.value);
                        setTransferEndStation('');
                        const filtered = stations.filter(s => s.LocationCity === e.target.value);
                        setFilteredStationsEnd(filtered);
                      }}
                      className="w-full border rounded px-3 py-2 text-gray-700"
                    >
                      <option value="">請選擇</option>
                      {cities.map((city, idx) => (
                        <option key={idx} value={city}>{city}</option>
                      ))}
                    </select>

                    {transferEndCity && (
                      <div>
                        <label className="block mt-4 mb-1 text-white font-medium">終點車站：</label>
                        <select
                          value={transferEndStation}
                          onChange={(e) => setTransferEndStation(e.target.value)}
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

                {transferLoading && (
                  <div className="text-white text-center mb-4">
                    搜尋轉乘路線中，請稍候...
                  </div>
                )}

                {transferError && (
                  <div className="text-red-400 text-center mb-4">
                    {transferError}
                  </div>
                )}

                {/* 查詢按鈕 */}
                <div className="flex justify-center">
                  <button
                    onClick={findTransferRoutes}
                    disabled={!transferStartStation || !transferEndStation || !selectedDate || transferLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
                  >
                    搜尋轉乘路線
                  </button>
                </div>

                {/* 轉乘結果表格 */}
                <TransferTable transferResults={transferResults} />
                </div>
            </section>
          )}
        </div>
      )}
      <Member />
      </div>
  );
}

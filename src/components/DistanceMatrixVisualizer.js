import React from 'react';

const DistanceMatrixVisualizer = ({ distanceMatrix, locations }) => {
  if (!distanceMatrix || !locations) {
    return (
      <div className="distance-matrix-visualizer">
        <h3>거리 행렬 시각화</h3>
        <p>경로 최적화 후에 거리 행렬이 표시됩니다.</p>
      </div>
    );
  }

  const formatTime = (seconds) => {
    if (seconds === Infinity) return '∞';
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}분`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}시간 ${mins}분`;
  };

  return (
    <div className="distance-matrix-visualizer" style={{ marginTop: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h3>거리 행렬 시각화 (API 호출 결과)</h3>
      <p>모든 지점 쌍 사이의 이동 시간 (분 단위)</p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '600px' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f5f5f5' }}>출발지 → 도착지</th>
              {locations.map((loc, index) => (
                <th key={index} style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f5f5f5', fontSize: '12px' }}>
                  {loc.name || `지점 ${index + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {locations.map((fromLoc, fromIndex) => (
              <tr key={fromIndex}>
                <td style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f5f5f5', fontWeight: 'bold', fontSize: '12px' }}>
                  {fromLoc.name || `지점 ${fromIndex + 1}`}
                </td>
                {locations.map((toLoc, toIndex) => (
                  <td
                    key={toIndex}
                    style={{
                      border: '1px solid #ddd',
                      padding: '8px',
                      textAlign: 'center',
                      backgroundColor: fromIndex === toIndex ? '#e0e0e0' : 'white',
                      fontSize: '11px'
                    }}
                  >
                    {fromIndex === toIndex ? '-' : formatTime(distanceMatrix[fromIndex][toIndex])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        <p>• ∞: 도달 불가능한 경로</p>
        <p>• -: 같은 지점</p>
        <p>• 이 행렬은 TSP 알고리즘의 입력으로 사용됩니다.</p>
      </div>
    </div>
  );
};

export default DistanceMatrixVisualizer;

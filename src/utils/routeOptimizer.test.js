import { BranchAndBoundOptimizer } from './routeOptimizer.js';

/**
 * Counterexample matrix from PR #3 review:
 *
 *   M = [[0,  2,  1,  100],
 *        [100,0,  0.5,7  ],
 *        [100,0.5,0,  3  ],
 *        [100,100,100,0  ]]
 *
 * Brute force:
 *   - 0→1→2→3 = 2 + 0.5 + 3 = 5.5 (optimal)
 *   - 0→2→1→3 = 1 + 0.5 + 7 = 8.5
 *
 * The original LB (symmetric MST) returned 8.5 (over-pruned on an invalid bound).
 * After fix (asymmetric valid LB) the result must be 5.5.
 */
describe('BranchAndBoundOptimizer — asymmetric optimality', () => {
  const counterMatrix = [
    [0, 2, 1, 100],
    [100, 0, 0.5, 7],
    [100, 0.5, 0, 3],
    [100, 100, 100, 0]
  ];

  function locs(n) {
    return Array(n).fill().map((_, i) => ({ name: `P${i}`, coords: { lat: 0, lng: 0 } }));
  }

  function bruteForceAsymmetric(M, startIndex, endIndex) {
    const n = M.length;
    const middle = [];
    for (let i = 0; i < n; i++) {
      if (i !== startIndex && i !== endIndex) middle.push(i);
    }
    let best = Infinity;
    const permute = (arr, current) => {
      if (arr.length === 0) {
        const route = [startIndex, ...current, endIndex];
        let cost = 0;
        for (let k = 0; k < route.length - 1; k++) cost += M[route[k]][route[k + 1]];
        if (cost < best) best = cost;
        return;
      }
      for (let i = 0; i < arr.length; i++) {
        permute(arr.slice(0, i).concat(arr.slice(i + 1)), [...current, arr[i]]);
      }
    };
    permute(middle, []);
    return best;
  }

  function makeAsymmetric(n, seed) {
    let s = seed;
    const rand = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    const M = Array(n).fill().map(() => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j) M[i][j] = 1 + rand() * 99;
      }
    }
    return M;
  }

  test('returns the true optimum on the user counterexample matrix', () => {
    const bb = new BranchAndBoundOptimizer(counterMatrix, locs(4)).optimize(0, 3);
    expect(bb).not.toBeNull();
    expect(bb.totalDistance).toBe(5.5);
    expect(bb.route).toEqual([0, 1, 2, 3]);
  });

  test('matches brute force on random asymmetric matrices (n=3..9)', () => {
    for (let n = 3; n <= 9; n++) {
      for (let trial = 0; trial < 10; trial++) {
        const M = makeAsymmetric(n, 1000 + n * 100 + trial);
        const opt = bruteForceAsymmetric(M, 0, n - 1);
        const bb = new BranchAndBoundOptimizer(M, locs(n)).optimize(0, n - 1);
        expect(bb.totalDistance).toBe(opt);
      }
    }
  });

  test('matches brute force on adversarial d[u][end] tiny / within-waypoint large (n=4..10)', () => {
    // This is the exact pattern that broke v3 (within-waypoint edge ≫ to-end edge).
    // The v3 LB forgot to consider to-end as a candidate for the outgoing edge sum.
    for (let n = 4; n <= 10; n++) {
      for (let trial = 0; trial < 5; trial++) {
        const M = Array(n).fill().map(() => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            if (i === j) continue;
            if (j === n - 1 && i !== 0) {
              // waypoint → end (tiny)
              M[i][j] = 1 + (i + trial) % 5;
            } else if (i !== 0 && j !== n - 1) {
              // waypoint → waypoint (large)
              M[i][j] = 50 + (i * 7 + j * 3 + trial) % 50;
            } else {
              M[i][j] = 5 + (i + j + trial) % 25;
            }
          }
        }
        const opt = bruteForceAsymmetric(M, 0, n - 1);
        const bb = new BranchAndBoundOptimizer(M, locs(n)).optimize(0, n - 1);
        expect(bb.totalDistance).toBe(opt);
      }
    }
  });

  test('LB invariant: LB ≤ actual remaining cost at every expanded node', () => {
    // The single most important property: at every recursion, the LB returned by
    // calculateLowerBound must be ≤ the true minimum remaining cost. If the LB
    // ever exceeds the actual remaining cost, the B&B can prune a subtree that
    // contains the global optimum — a silent correctness bug.
    function bruteForceRem(M, route, unvisited, endIndex) {
      const arr = Array.from(unvisited);
      if (arr.length === 0) {
        const cur = route[route.length - 1];
        return M[cur][endIndex];
      }
      let best = Infinity;
      const permute = (a, c) => {
        if (a.length === 0) {
          const fullRoute = [...route, ...c, endIndex];
          let cost = 0;
          for (let k = 0; k < fullRoute.length - 1; k++) cost += M[fullRoute[k]][fullRoute[k + 1]];
          if (cost < best) best = cost;
          return;
        }
        for (let i = 0; i < a.length; i++) {
          permute(a.slice(0, i).concat(a.slice(i + 1)), [...c, a[i]]);
        }
      };
      permute(arr, []);
      return best;
    }

    const matrices = [
      counterMatrix,
      // v3-invalidation scenario: within-unvisited huge, to-end tiny
      [[0, 10, 10, 10], [10, 0, 100, 1], [10, 100, 0, 1], [10, 1, 1, 0]],
      ...Array.from({ length: 20 }, (_, i) => makeAsymmetric(5, 2000 + i)),
      ...Array.from({ length: 10 }, (_, i) => makeAsymmetric(6, 3000 + i)),
      ...Array.from({ length: 5 }, (_, i) => makeAsymmetric(7, 4000 + i))
    ];

    for (const M of matrices) {
      const n = M.length;
      const bb = new BranchAndBoundOptimizer(M, locs(n));
      const violations = [];

      function walk(route, unvisited, cost, depth) {
        if (depth === 0 || unvisited.size === 0) {
          if (route.length > 0 && unvisited.size > 0) {
            const cur = route[route.length - 1];
            const lb = bb.calculateLowerBound(cur, unvisited, n - 1);
            const trueRem = bruteForceRem(M, route, unvisited, n - 1) - cost;
            if (lb > trueRem + 1e-9) {
              violations.push({ route, lb, trueRem });
            }
          }
          return;
        }
        const cur = route[route.length - 1];
        for (const next of unvisited) {
          const nu = new Set(unvisited);
          nu.delete(next);
          walk([...route, next], nu, cost + M[cur][next], depth - 1);
        }
      }
      walk([0], new Set(Array.from({ length: n - 2 }, (_, i) => i + 1)), 0, Math.min(n - 2, 3));

      expect(violations).toEqual([]);
    }
  });
});

function getPermutations(array) {
  if (array.length === 1) return [array];
  const permutations = [];
  const firstEl = array[0];
  const rest = array.slice(1);
  const permsOfRest = getPermutations(rest);
  permsOfRest.forEach(perm => {
    for (let i = 0; i <= perm.length; i++) {
      const newPerm = [...perm.slice(0, i), firstEl, ...perm.slice(i)];
      permutations.push(newPerm);
    }
  });
  return permutations;
}

export default getPermutations;

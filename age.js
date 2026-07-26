const ages = [
    { name: "Mani", age: 22 },
    { name: "Keval", age: 22 },
    { name: "Shubham", age: 21 },
    { name: "Vishnu", age: 19 },
    { name: "Yash", age: 22 },
]

let reduced = ages.reduce((group,  ) => {
    const val = people.age;
    if (!group[val]) group[val] = [];
    group[val].push(people.name);
    return group;
}, {});

console.log(reduced);
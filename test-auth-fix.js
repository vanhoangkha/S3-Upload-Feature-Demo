// Test the auth parsing logic
function parseGroups(groupsValue) {
    let groups = [];
    if (groupsValue) {
        if (Array.isArray(groupsValue)) {
            groups = groupsValue;
        } else if (typeof groupsValue === 'string') {
            if (groupsValue.startsWith('[') && groupsValue.endsWith(']')) {
                try {
                    groups = JSON.parse(groupsValue);
                } catch {
                    groups = [groupsValue.slice(1, -1)];
                }
            } else {
                groups = [groupsValue];
            }
        }
    }
    return groups;
}

// Test cases
console.log('Test 1 - String array:', parseGroups('[Admin]')); // Should be ["Admin"]
console.log('Test 2 - Array:', parseGroups(['Admin'])); // Should be ["Admin"]  
console.log('Test 3 - Simple string:', parseGroups('Admin')); // Should be ["Admin"]
console.log('Test 4 - Multiple in string:', parseGroups('[Admin,User]')); // Should be ["Admin,User"] or ["Admin", "User"]

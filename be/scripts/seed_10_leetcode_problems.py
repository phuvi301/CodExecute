import os
import sys
import random
import io
from pathlib import Path
from decimal import Decimal

# Set standard stdout/stderr encoding
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(ROOT_DIR))
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

from botocore.exceptions import ClientError
from app.core.aws import s3_client, dynamodb_resource
from app.core.config import settings

BUCKET_NAME = settings.S3_TESTCASE_BUCKET
problems_table = dynamodb_resource.Table(settings.DYNAMODB_PROBLEMS_TABLE)
testcases_table = dynamodb_resource.Table(settings.DYNAMODB_TESTCASES_TABLE)

def ensure_bucket_exists():
    try:
        s3_client.head_bucket(Bucket=BUCKET_NAME)
        print(f"✅ S3 Bucket '{BUCKET_NAME}' exists.")
    except ClientError as e:
        error_code = int(e.response['Error']['Code']) if 'Code' in e.response['Error'] else 0
        if error_code == 404 or e.response['Error'].get('Code') == 'NoSuchBucket':
            print(f"⚡ Creating S3 Bucket '{BUCKET_NAME}'...")
            try:
                if settings.AWS_REGION == "us-east-1":
                    s3_client.create_bucket(Bucket=BUCKET_NAME)
                else:
                    s3_client.create_bucket(
                        Bucket=BUCKET_NAME,
                        CreateBucketConfiguration={'LocationConstraint': settings.AWS_REGION}
                    )
                print(f"✅ Created S3 Bucket '{BUCKET_NAME}' successfully.")
            except Exception as create_err:
                print(f"❌ Error creating bucket: {create_err}")
        else:
            print(f"⚠️ Bucket check warning: {e}")

# ==========================================
# PROBLEM DEFINITIONS (10 LEETCODE PROBLEMS)
# ==========================================

PROBLEMS = [
    # 1. Two Sum
    {
        "ProblemID": "two-sum",
        "Title": "Two Sum",
        "Difficulty": "Easy",
        "Category": "Array & Hash Table",
        "AcceptanceRate": Decimal("52.4"),
        "TimeLimit": Decimal("2.0"),
        "MemoryLimit": 256,
        "TimeComplexity": "O(N)",
        "SpaceComplexity": "O(N)",
        "Description": """Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.

### Input Format:
- Line 1: Space-separated integers representing array `nums`.
- Line 2: Integer `target`.

### Output Format:
- Space-separated indices `i j` of the two numbers.""",
        "Constraints": """2 <= nums.length <= 10^4
-10^9 <= nums[i] <= 10^9
-10^9 <= target <= 10^9
Only one valid answer exists.""",
        "Examples": [
            {"input": "2 7 11 15\n9", "output": "0 1", "explanation": "Because nums[0] + nums[1] == 9, we return 0 1."},
            {"input": "3 2 4\n6", "output": "1 2", "explanation": "nums[1] + nums[2] == 6, we return 1 2."},
            {"input": "3 3\n6", "output": "0 1", "explanation": "nums[0] + nums[1] == 6, we return 0 1."}
        ],
        "InitCode": {
            "python": """import sys

def solve():
    lines = sys.stdin.read().strip().splitlines()
    if len(lines) < 2:
        return
    nums = list(map(int, lines[0].split()))
    target = int(lines[1])
    
    # TODO: Write your solution here
    pass

if __name__ == "__main__":
    solve()""",
            "javascript": """const fs = require('fs');

function solve() {
    const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');
    if (lines.length < 2) return;
    const nums = lines[0].trim().split(/\\s+/).map(Number);
    const target = parseInt(lines[1]);
    
    // TODO: Write your solution here

}

solve();""",
            "cpp": """#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

int main() {
    vector<int> nums;
    int val;
    while (cin >> val) {
        nums.push_back(val);
    }
    if (nums.size() < 2) return 0;
    int target = nums.back();
    nums.pop_back();

    // TODO: Write your solution here

    return 0;
}""",
            "java": """import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        ArrayList<Integer> nums = new ArrayList<>();
        while (sc.hasNextInt()) {
            nums.add(sc.nextInt());
        }
        if (nums.size() < 2) return;
        int target = nums.remove(nums.size() - 1);

        // TODO: Write your solution here

    }
}"""
        }
    },

    # 2. Add Two Numbers
    {
        "ProblemID": "add-two-numbers",
        "Title": "Add Two Numbers",
        "Difficulty": "Medium",
        "Category": "Linked List & Math",
        "AcceptanceRate": Decimal("43.8"),
        "TimeLimit": Decimal("2.0"),
        "MemoryLimit": 256,
        "TimeComplexity": "O(max(N, M))",
        "SpaceComplexity": "O(max(N, M))",
        "Description": """You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.

You may assume the two numbers do not contain any leading zero, except the number 0 itself.

### Input Format:
- Line 1: Space-separated digits of the first list (in reverse order).
- Line 2: Space-separated digits of the second list (in reverse order).

### Output Format:
- Space-separated digits representing the sum (in reverse order).""",
        "Constraints": """The number of nodes in each linked list is in the range [1, 100].
0 <= Node.val <= 9
It is guaranteed that the list represents a number that does not have leading zeros.""",
        "Examples": [
            {"input": "2 4 3\n5 6 4", "output": "7 0 8", "explanation": "342 + 465 = 807."},
            {"input": "0\n0", "output": "0", "explanation": ""},
            {"input": "9 9 9 9 9 9 9\n9 9 9 9", "output": "8 9 9 9 0 0 0 1", "explanation": ""}
        ],
        "InitCode": {
            "python": """import sys

def solve():
    lines = sys.stdin.read().strip().splitlines()
    if not lines:
        return
    l1 = list(map(int, lines[0].split())) if lines[0].strip() else []
    l2 = list(map(int, lines[1].split())) if len(lines) > 1 and lines[1].strip() else []

    # TODO: Write your solution here
    pass

if __name__ == "__main__":
    solve()""",
            "javascript": """const fs = require('fs');

function solve() {
    const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');
    if (!lines || lines.length === 0) return;
    const l1 = lines[0].trim() ? lines[0].trim().split(/\\s+/).map(Number) : [];
    const l2 = lines.length > 1 && lines[1].trim() ? lines[1].trim().split(/\\s+/).map(Number) : [];

    // TODO: Write your solution here

}

solve();""",
            "cpp": """#include <iostream>
#include <vector>
#include <string>
#include <sstream>
using namespace std;

int main() {
    string line1, line2;
    if (!getline(cin, line1)) return 0;
    getline(cin, line2);

    vector<int> l1, l2;
    stringstream ss1(line1), ss2(line2);
    int x;
    while (ss1 >> x) l1.push_back(x);
    while (ss2 >> x) l2.push_back(x);

    // TODO: Write your solution here

    return 0;
}""",
            "java": """import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextLine()) return;
        String line1 = sc.nextLine();
        String line2 = sc.hasNextLine() ? sc.nextLine() : "";

        // TODO: Write your solution here

    }
}"""
        }
    },

    # 3. Longest Substring Without Repeating Characters
    {
        "ProblemID": "longest-substring-without-repeating-characters",
        "Title": "Longest Substring Without Repeating Characters",
        "Difficulty": "Medium",
        "Category": "String & Sliding Window",
        "AcceptanceRate": Decimal("35.1"),
        "TimeLimit": Decimal("2.0"),
        "MemoryLimit": 256,
        "TimeComplexity": "O(N)",
        "SpaceComplexity": "O(min(N, M))",
        "Description": """Given a string `s`, find the length of the longest substring without repeating characters.

### Input Format:
- Single line containing the string `s`. (String may contain letters, digits, symbols and spaces).

### Output Format:
- Single integer representing the length of the longest non-repeating substring.""",
        "Constraints": """0 <= s.length <= 5 * 10^4
s consists of English letters, digits, symbols and spaces.""",
        "Examples": [
            {"input": "abcabcbb", "output": "3", "explanation": "The answer is \"abc\", with the length of 3."},
            {"input": "bbbbb", "output": "1", "explanation": "The answer is \"b\", with the length of 1."},
            {"input": "pwwkew", "output": "3", "explanation": "The answer is \"wke\", with the length of 3."}
        ],
        "InitCode": {
            "python": """import sys

def solve():
    s = sys.stdin.read().rstrip('\\r\\n')
    
    # TODO: Write your solution here
    pass

if __name__ == "__main__":
    solve()""",
            "javascript": """const fs = require('fs');

function solve() {
    const s = fs.readFileSync(0, 'utf-8').replace(/[\\r\\n]+$/, '');
    
    // TODO: Write your solution here

}

solve();""",
            "cpp": """#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    string s;
    getline(cin, s);
    
    // TODO: Write your solution here

    return 0;
}""",
            "java": """import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNextLine() ? sc.nextLine() : "";
        
        // TODO: Write your solution here

    }
}"""
        }
    },

    # 4. Median of Two Sorted Arrays
    {
        "ProblemID": "median-of-two-sorted-arrays",
        "Title": "Median of Two Sorted Arrays",
        "Difficulty": "Hard",
        "Category": "Array & Binary Search",
        "AcceptanceRate": Decimal("38.9"),
        "TimeLimit": Decimal("2.0"),
        "MemoryLimit": 256,
        "TimeComplexity": "O(log(min(M, N)))",
        "SpaceComplexity": "O(1)",
        "Description": """Given two sorted arrays `nums1` and `nums2` of size `m` and `n` respectively, return the median of the two sorted arrays.

The overall run time complexity should be O(log (m+n)).

### Input Format:
- Line 1: Space-separated integers representing sorted array `nums1`.
- Line 2: Space-separated integers representing sorted array `nums2`.

### Output Format:
- Float value formatted to 5 decimal places representing the median.""",
        "Constraints": """nums1.length == m
nums2.length == n
0 <= m <= 1000
0 <= n <= 1000
1 <= m + n <= 2000
-10^6 <= nums1[i], nums2[i] <= 10^6""",
        "Examples": [
            {"input": "1 3\n2", "output": "2.00000", "explanation": "Merged array = [1,2,3] and median is 2."},
            {"input": "1 2\n3 4", "output": "2.50000", "explanation": "Merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5."}
        ],
        "InitCode": {
            "python": """import sys

def solve():
    lines = sys.stdin.read().strip().splitlines()
    nums1 = list(map(int, lines[0].split())) if len(lines) > 0 and lines[0].strip() else []
    nums2 = list(map(int, lines[1].split())) if len(lines) > 1 and lines[1].strip() else []

    # TODO: Write your solution here
    pass

if __name__ == "__main__":
    solve()""",
            "javascript": """const fs = require('fs');

function solve() {
    const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');
    const nums1 = lines.length > 0 && lines[0].trim() ? lines[0].trim().split(/\\s+/).map(Number) : [];
    const nums2 = lines.length > 1 && lines[1].trim() ? lines[1].trim().split(/\\s+/).map(Number) : [];

    // TODO: Write your solution here

}

solve();""",
            "cpp": """#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <iomanip>
using namespace std;

int main() {
    string line1, line2;
    getline(cin, line1);
    getline(cin, line2);

    vector<int> nums1, nums2;
    int x;
    stringstream ss1(line1), ss2(line2);
    while (ss1 >> x) nums1.push_back(x);
    while (ss2 >> x) nums2.push_back(x);

    // TODO: Write your solution here

    return 0;
}""",
            "java": """import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String line1 = sc.hasNextLine() ? sc.nextLine() : "";
        String line2 = sc.hasNextLine() ? sc.nextLine() : "";

        // TODO: Write your solution here

    }
}"""
        }
    },

    # 5. Longest Palindromic Substring
    {
        "ProblemID": "longest-palindromic-substring",
        "Title": "Longest Palindromic Substring",
        "Difficulty": "Medium",
        "Category": "String & Dynamic Programming",
        "AcceptanceRate": Decimal("33.8"),
        "TimeLimit": Decimal("2.0"),
        "MemoryLimit": 256,
        "TimeComplexity": "O(N^2)",
        "SpaceComplexity": "O(1)",
        "Description": """Given a string `s`, return the longest palindromic substring in `s`.

### Input Format:
- Single line containing string `s`.

### Output Format:
- String representing the longest palindromic substring.""",
        "Constraints": """1 <= s.length <= 1000
s consists of only digits and English letters.""",
        "Examples": [
            {"input": "babad", "output": "bab", "explanation": "\"aba\" is also a valid answer."},
            {"input": "cbbd", "output": "bb", "explanation": ""}
        ],
        "InitCode": {
            "python": """import sys

def solve():
    s = sys.stdin.read().strip()
    
    # TODO: Write your solution here
    pass

if __name__ == "__main__":
    solve()""",
            "javascript": """const fs = require('fs');

function solve() {
    const s = fs.readFileSync(0, 'utf-8').trim();
    
    // TODO: Write your solution here

}

solve();""",
            "cpp": """#include <iostream>
#include <string>
using namespace std;

int main() {
    string s;
    if (!(cin >> s)) return 0;
    
    // TODO: Write your solution here

    return 0;
}""",
            "java": """import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNext()) return;
        String s = sc.next();
        
        // TODO: Write your solution here

    }
}"""
        }
    },

    # 6. Container With Most Water
    {
        "ProblemID": "container-with-most-water",
        "Title": "Container With Most Water",
        "Difficulty": "Medium",
        "Category": "Array & Two Pointers",
        "AcceptanceRate": Decimal("54.6"),
        "TimeLimit": Decimal("2.0"),
        "MemoryLimit": 256,
        "TimeComplexity": "O(N)",
        "SpaceComplexity": "O(1)",
        "Description": """You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the `i-th` line are `(i, 0)` and `(i, height[i])`.

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return the maximum amount of water a container can store.

### Input Format:
- Line 1: Space-separated integers representing array `height`.

### Output Format:
- Single integer representing maximum water capacity.""",
        "Constraints": """n == height.length
2 <= n <= 10^5
0 <= height[i] <= 10^4""",
        "Examples": [
            {"input": "1 8 6 2 5 4 8 3 7", "output": "49", "explanation": "The vertical lines are [1,8,6,2,5,4,8,3,7]. Max area is between index 1 (height 8) and index 8 (height 7), distance = 7, area = 7 * 7 = 49."},
            {"input": "1 1", "output": "1", "explanation": ""}
        ],
        "InitCode": {
            "python": """import sys

def solve():
    height = list(map(int, sys.stdin.read().split()))
    
    # TODO: Write your solution here
    pass

if __name__ == "__main__":
    solve()""",
            "javascript": """const fs = require('fs');

function solve() {
    const height = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/).map(Number);
    
    // TODO: Write your solution here

}

solve();""",
            "cpp": """#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    vector<int> height;
    int h;
    while (cin >> h) height.push_back(h);

    // TODO: Write your solution here

    return 0;
}""",
            "java": """import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Integer> height = new ArrayList<>();
        while (sc.hasNextInt()) height.add(sc.nextInt());

        // TODO: Write your solution here

    }
}"""
        }
    },

    # 7. 3Sum
    {
        "ProblemID": "3sum",
        "Title": "3Sum",
        "Difficulty": "Medium",
        "Category": "Array & Two Pointers",
        "AcceptanceRate": Decimal("34.2"),
        "TimeLimit": Decimal("2.0"),
        "MemoryLimit": 256,
        "TimeComplexity": "O(N^2)",
        "SpaceComplexity": "O(1)",
        "Description": """Given an integer array `nums`, return all the triplets `[nums[i], nums[j], nums[k]]` such that `i != j`, `i != k`, and `j != k`, and `nums[i] + nums[j] + nums[k] == 0`.

Notice that the solution set must not contain duplicate triplets.

### Input Format:
- Line 1: Space-separated integers representing array `nums`.

### Output Format:
- Each line contains a space-separated triplet `a b c` (sorted a <= b <= c). Triplets are sorted lexicographically.
- If no triplet exists, output `EMPTY`.""",
        "Constraints": """3 <= nums.length <= 3000
-10^5 <= nums[i] <= 10^5""",
        "Examples": [
            {"input": "-1 0 1 2 -1 -4", "output": "-1 -1 2\n-1 0 1", "explanation": "The distinct triplets are [-1,0,1] and [-1,-1,2]."},
            {"input": "0 1 1", "output": "EMPTY", "explanation": "The only possible triplet does not sum up to 0."},
            {"input": "0 0 0", "output": "0 0 0", "explanation": "The only possible triplet sums up to 0."}
        ],
        "InitCode": {
            "python": """import sys

def solve():
    nums = list(map(int, sys.stdin.read().split()))
    
    # TODO: Write your solution here
    pass

if __name__ == "__main__":
    solve()""",
            "javascript": """const fs = require('fs');

function solve() {
    const nums = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/).map(Number);
    
    // TODO: Write your solution here

}

solve();""",
            "cpp": """#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    vector<int> nums;
    int x;
    while (cin >> x) nums.push_back(x);

    // TODO: Write your solution here

    return 0;
}""",
            "java": """import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Integer> nums = new ArrayList<>();
        while (sc.hasNextInt()) nums.add(sc.nextInt());

        // TODO: Write your solution here

    }
}"""
        }
    },

    # 8. Valid Parentheses
    {
        "ProblemID": "valid-parentheses",
        "Title": "Valid Parentheses",
        "Difficulty": "Easy",
        "Category": "String & Stack",
        "AcceptanceRate": Decimal("40.4"),
        "TimeLimit": Decimal("2.0"),
        "MemoryLimit": 256,
        "TimeComplexity": "O(N)",
        "SpaceComplexity": "O(N)",
        "Description": """Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

### Input Format:
- Single line containing string `s`.

### Output Format:
- `true` or `false`.""",
        "Constraints": """1 <= s.length <= 10^4
s consists of parentheses only '()[]{}'.""",
        "Examples": [
            {"input": "()", "output": "true", "explanation": ""},
            {"input": "()[]{}", "output": "true", "explanation": ""},
            {"input": "(]", "output": "false", "explanation": ""}
        ],
        "InitCode": {
            "python": """import sys

def solve():
    s = sys.stdin.read().strip()
    
    # TODO: Write your solution here
    pass

if __name__ == "__main__":
    solve()""",
            "javascript": """const fs = require('fs');

function solve() {
    const s = fs.readFileSync(0, 'utf-8').trim();
    
    // TODO: Write your solution here

}

solve();""",
            "cpp": """#include <iostream>
#include <string>
#include <stack>
using namespace std;

int main() {
    string s;
    if (!(cin >> s)) return 0;
    
    // TODO: Write your solution here

    return 0;
}""",
            "java": """import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNext()) return;
        String s = sc.next();
        
        // TODO: Write your solution here

    }
}"""
        }
    },

    # 9. Merge Two Sorted Lists
    {
        "ProblemID": "merge-two-sorted-lists",
        "Title": "Merge Two Sorted Lists",
        "Difficulty": "Easy",
        "Category": "Linked List",
        "AcceptanceRate": Decimal("63.2"),
        "TimeLimit": Decimal("2.0"),
        "MemoryLimit": 256,
        "TimeComplexity": "O(N + M)",
        "SpaceComplexity": "O(1)",
        "Description": """You are given the heads of two sorted linked lists `list1` and `list2`.

Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.

Return the merged sorted list.

### Input Format:
- Line 1: Space-separated sorted integers of `list1`.
- Line 2: Space-separated sorted integers of `list2`.

### Output Format:
- Space-separated sorted integers of the merged list.""",
        "Constraints": """The number of nodes in both lists is in the range [0, 50].
-100 <= Node.val <= 100
Both list1 and list2 are sorted in non-decreasing order.""",
        "Examples": [
            {"input": "1 2 4\n1 3 4", "output": "1 1 2 3 4 4", "explanation": ""},
            {"input": "\n", "output": "", "explanation": ""},
            {"input": "\n0", "output": "0", "explanation": ""}
        ],
        "InitCode": {
            "python": """import sys

def solve():
    lines = sys.stdin.read().strip().splitlines()
    l1 = list(map(int, lines[0].split())) if len(lines) > 0 and lines[0].strip() else []
    l2 = list(map(int, lines[1].split())) if len(lines) > 1 and lines[1].strip() else []

    # TODO: Write your solution here
    pass

if __name__ == "__main__":
    solve()""",
            "javascript": """const fs = require('fs');

function solve() {
    const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');
    const l1 = lines.length > 0 && lines[0].trim() ? lines[0].trim().split(/\\s+/).map(Number) : [];
    const l2 = lines.length > 1 && lines[1].trim() ? lines[1].trim().split(/\\s+/).map(Number) : [];

    // TODO: Write your solution here

}

solve();""",
            "cpp": """#include <iostream>
#include <vector>
#include <string>
#include <sstream>
using namespace std;

int main() {
    string line1, line2;
    getline(cin, line1);
    getline(cin, line2);

    vector<int> l1, l2;
    int x;
    stringstream ss1(line1), ss2(line2);
    while (ss1 >> x) l1.push_back(x);
    while (ss2 >> x) l2.push_back(x);

    // TODO: Write your solution here

    return 0;
}""",
            "java": """import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String line1 = sc.hasNextLine() ? sc.nextLine() : "";
        String line2 = sc.hasNextLine() ? sc.nextLine() : "";

        // TODO: Write your solution here

    }
}"""
        }
    },

    # 10. Best Time to Buy and Sell Stock
    {
        "ProblemID": "best-time-to-buy-and-sell-stock",
        "Title": "Best Time to Buy and Sell Stock",
        "Difficulty": "Easy",
        "Category": "Array & Dynamic Programming",
        "AcceptanceRate": Decimal("54.1"),
        "TimeLimit": Decimal("2.0"),
        "MemoryLimit": 256,
        "TimeComplexity": "O(N)",
        "SpaceComplexity": "O(1)",
        "Description": """You are given an array `prices` where `prices[i]` is the price of a given stock on the `i-th` day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.

### Input Format:
- Line 1: Space-separated integers representing array `prices`.

### Output Format:
- Single integer representing maximum achievable profit.""",
        "Constraints": """1 <= prices.length <= 10^5
0 <= prices[i] <= 10^4""",
        "Examples": [
            {"input": "7 1 5 3 6 4", "output": "5", "explanation": "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5."},
            {"input": "7 6 4 3 1", "output": "0", "explanation": "In this case, no transactions are done and max profit = 0."}
        ],
        "InitCode": {
            "python": """import sys

def solve():
    prices = list(map(int, sys.stdin.read().split()))
    
    # TODO: Write your solution here
    pass

if __name__ == "__main__":
    solve()""",
            "javascript": """const fs = require('fs');

function solve() {
    const prices = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/).map(Number);
    
    // TODO: Write your solution here

}

solve();""",
            "cpp": """#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> prices;
    int p;
    while (cin >> p) prices.push_back(p);

    // TODO: Write your solution here

    return 0;
}""",
            "java": """import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Integer> prices = new ArrayList<>();
        while (sc.hasNextInt()) prices.add(sc.nextInt());

        // TODO: Write your solution here

    }
}"""
        }
    }
]

# ==========================================
# TESTCASE GENERATOR FUNCTIONS FOR EACH PROBLEM
# ==========================================

def generate_two_sum_tc(i: int):
    if i == 1: return "2 7 11 15\n9", "0 1"
    if i == 2: return "3 2 4\n6", "1 2"
    if i == 3: return "3 3\n6", "0 1"
    random.seed(i * 1000 + 1)
    while True:
        n = random.randint(3, 100 if i <= 20 else 1000)
        low, high = -1000, 1000
        nums = random.sample(range(low, high + 1), n)
        idx1 = random.randint(0, n - 2)
        idx2 = random.randint(idx1 + 1, n - 1)
        target = nums[idx1] + nums[idx2]

        seen = {}
        pair_count = 0
        valid = True
        for idx, num in enumerate(nums):
            diff = target - num
            if diff in seen:
                pair_count += 1
                if pair_count > 1:
                    valid = False
                    break
            seen[num] = idx

        if valid and pair_count == 1:
            return f"{' '.join(map(str, nums))}\n{target}", f"{idx1} {idx2}"

def generate_add_two_numbers_tc(i: int):
    if i == 1: return "2 4 3\n5 6 4", "7 0 8"
    if i == 2: return "0\n0", "0"
    if i == 3: return "9 9 9 9 9 9 9\n9 9 9 9", "8 9 9 9 0 0 0 1"
    random.seed(i * 1000 + 2)
    len1 = random.randint(1, min(50, i * 2))
    len2 = random.randint(1, min(50, i * 2))
    l1 = [random.randint(1 if j == 0 else 0, 9) for j in range(len1)]
    l2 = [random.randint(1 if j == 0 else 0, 9) for j in range(len2)]
    num1 = int(''.join(map(str, reversed(l1))))
    num2 = int(''.join(map(str, reversed(l2))))
    total_sum = num1 + num2
    res_list = [int(c) for c in reversed(str(total_sum))]
    return f"{' '.join(map(str, l1))}\n{' '.join(map(str, l2))}", f"{' '.join(map(str, res_list))}"

def generate_longest_substring_tc(i: int):
    if i == 1: return "abcabcbb", "3"
    if i == 2: return "bbbbb", "1"
    if i == 3: return "pwwkew", "3"
    random.seed(i * 1000 + 3)
    chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*() "
    length = random.randint(5, 50 if i <= 20 else 300)
    s = "".join(random.choice(chars) for _ in range(length))

    seen = {}
    left = 0
    max_len = 0
    for right, char in enumerate(s):
        if char in seen and seen[char] >= left:
            left = seen[char] + 1
        seen[char] = right
        max_len = max(max_len, right - left + 1)
    return s, str(max_len)

def generate_median_sorted_arrays_tc(i: int):
    if i == 1: return "1 3\n2", "2.00000"
    if i == 2: return "1 2\n3 4", "2.50000"
    if i == 3: return "0 0\n0 0", "0.00000"
    random.seed(i * 1000 + 4)
    m = random.randint(0 if i > 10 else 1, 50 if i <= 20 else 200)
    n = random.randint(1 if m == 0 else 0, 50 if i <= 20 else 200)
    nums1 = sorted([random.randint(-1000, 1000) for _ in range(m)])
    nums2 = sorted([random.randint(-1000, 1000) for _ in range(n)])
    merged = sorted(nums1 + nums2)
    tot = len(merged)
    if tot % 2 == 1:
        ans = float(merged[tot // 2])
    else:
        ans = (merged[tot // 2 - 1] + merged[tot // 2]) / 2.0
    return f"{' '.join(map(str, nums1))}\n{' '.join(map(str, nums2))}", f"{ans:.5f}"

def generate_longest_palindrome_tc(i: int):
    if i == 1: return "babad", "bab"
    if i == 2: return "cbbd", "bb"
    if i == 3: return "a", "a"
    random.seed(i * 1000 + 5)
    chars = "abcdefghijklmnopqrstuvwxyz0123456789"
    length = random.randint(3, 40 if i <= 20 else 150)
    s = "".join(random.choice(chars) for _ in range(length))

    res = ""
    for idx in range(len(s)):
        l, r = idx, idx
        while l >= 0 and r < len(s) and s[l] == s[r]:
            if r - l + 1 > len(res): res = s[l:r+1]
            l -= 1; r += 1
        l, r = idx, idx + 1
        while l >= 0 and r < len(s) and s[l] == s[r]:
            if r - l + 1 > len(res): res = s[l:r+1]
            l -= 1; r += 1
    return s, res

def generate_container_water_tc(i: int):
    if i == 1: return "1 8 6 2 5 4 8 3 7", "49"
    if i == 2: return "1 1", "1"
    if i == 3: return "4 3 2 1 4", "16"
    random.seed(i * 1000 + 6)
    n = random.randint(2, 50 if i <= 20 else 500)
    height = [random.randint(0, 1000) for _ in range(n)]

    l, r = 0, len(height) - 1
    max_area = 0
    while l < r:
        area = min(height[l], height[r]) * (r - l)
        max_area = max(max_area, area)
        if height[l] < height[r]: l += 1
        else: r -= 1
    return " ".join(map(str, height)), str(max_area)

def generate_3sum_tc(i: int):
    if i == 1: return "-1 0 1 2 -1 -4", "-1 -1 2\n-1 0 1"
    if i == 2: return "0 1 1", "EMPTY"
    if i == 3: return "0 0 0", "0 0 0"
    random.seed(i * 1000 + 7)
    n = random.randint(3, 30 if i <= 20 else 100)
    nums = [random.randint(-50, 50) for _ in range(n)]
    nums.sort()
    res = []
    for idx in range(len(nums) - 2):
        if idx > 0 and nums[idx] == nums[idx - 1]: continue
        l, r = idx + 1, len(nums) - 1
        while l < r:
            s = nums[idx] + nums[l] + nums[r]
            if s == 0:
                res.append(f"{nums[idx]} {nums[l]} {nums[r]}")
                while l < r and nums[l] == nums[l + 1]: l += 1
                while l < r and nums[r] == nums[r - 1]: r -= 1
                l += 1; r -= 1
            elif s < 0: l += 1
            else: r -= 1
    out_str = "EMPTY" if not res else "\n".join(res)
    return " ".join(map(str, nums)), out_str

def generate_valid_parentheses_tc(i: int):
    if i == 1: return "()", "true"
    if i == 2: return "()[]{}", "true"
    if i == 3: return "(]", "false"
    random.seed(i * 1000 + 8)
    if i % 2 == 0:
        # Generate valid
        pairs = ["()", "[]", "{}"]
        stack = []
        res = []
        for _ in range(random.randint(1, 20)):
            p = random.choice(pairs)
            res.append(p[0])
            stack.append(p[1])
        while stack:
            res.append(stack.pop())
        s = "".join(res)
    else:
        # Generate random (likely invalid)
        chars = "()[]{}"
        s = "".join(random.choice(chars) for _ in range(random.randint(2, 30)))

    stack = []
    mapping = {')': '(', '}': '{', ']': '['}
    is_valid = True
    for c in s:
        if c in mapping:
            top = stack.pop() if stack else '#'
            if mapping[c] != top:
                is_valid = False; break
        else: stack.append(c)
    if stack: is_valid = False
    return s, "true" if is_valid else "false"

def generate_merge_two_sorted_lists_tc(i: int):
    if i == 1: return "1 2 4\n1 3 4", "1 1 2 3 4 4"
    if i == 2: return "\n", ""
    if i == 3: return "\n0", "0"
    random.seed(i * 1000 + 9)
    len1 = random.randint(0, 30)
    len2 = random.randint(0, 30)
    l1 = sorted([random.randint(-100, 100) for _ in range(len1)])
    l2 = sorted([random.randint(-100, 100) for _ in range(len2)])
    merged = sorted(l1 + l2)
    return f"{' '.join(map(str, l1))}\n{' '.join(map(str, l2))}", " ".join(map(str, merged))

def generate_best_time_stock_tc(i: int):
    if i == 1: return "7 1 5 3 6 4", "5"
    if i == 2: return "7 6 4 3 1", "0"
    if i == 3: return "2 4 1", "2"
    random.seed(i * 1000 + 10)
    n = random.randint(1, 50 if i <= 20 else 500)
    prices = [random.randint(0, 500) for _ in range(n)]

    min_p = float('inf')
    max_profit = 0
    for p in prices:
        if p < min_p: min_p = p
        elif p - min_p > max_profit: max_profit = p - min_p
    return " ".join(map(str, prices)), str(max_profit)

GENERATORS = {
    "two-sum": generate_two_sum_tc,
    "add-two-numbers": generate_add_two_numbers_tc,
    "longest-substring-without-repeating-characters": generate_longest_substring_tc,
    "median-of-two-sorted-arrays": generate_median_sorted_arrays_tc,
    "longest-palindromic-substring": generate_longest_palindrome_tc,
    "container-with-most-water": generate_container_water_tc,
    "3sum": generate_3sum_tc,
    "valid-parentheses": generate_valid_parentheses_tc,
    "merge-two-sorted-lists": generate_merge_two_sorted_lists_tc,
    "best-time-to-buy-and-sell-stock": generate_best_time_stock_tc,
}

# ==========================================
# SEEDING EXECUTION
# ==========================================

def seed_problems():
    print("🚀 --- SEEDING 10 LEETCODE PROBLEMS INTO DYNAMODB ---")
    for prob in PROBLEMS:
        pid = prob["ProblemID"]
        print(f"  -> Seeding problem '{pid}' ({prob['Title']})...")
        try:
            problems_table.put_item(Item=prob)
            print(f"  ✅ Saved problem '{pid}' to DynamoDB.")
        except Exception as e:
            print(f"  ❌ Error saving problem '{pid}': {e}")

def seed_testcases():
    print("\n🚀 --- SEEDING 50 TESTCASES PER PROBLEM TO S3 & DYNAMODB ---")
    ensure_bucket_exists()

    for prob in PROBLEMS:
        pid = prob["ProblemID"]
        gen_fn = GENERATORS.get(pid)
        if not gen_fn:
            continue

        print(f"\n📦 Seeding 50 testcases for problem '{pid}'...")

        # Delete existing testcases in DynamoDB for this problem
        try:
            old_items = testcases_table.scan(
                FilterExpression="ProblemID = :pid",
                ExpressionAttributeValues={":pid": pid}
            ).get("Items", [])
            for item in old_items:
                testcases_table.delete_item(Key={"ProblemID": pid, "TestCaseID": item["TestCaseID"]})
        except Exception as e:
            print(f"  ⚠️ Warning cleaning old testcases: {e}")

        success_count = 0
        for i in range(1, 51):
            input_text, output_text = gen_fn(i)
            input_key = f"{pid}/input/{i}.txt"
            output_key = f"{pid}/output/{i}.txt"

            # 1. Upload to S3
            try:
                s3_client.put_object(
                    Bucket=BUCKET_NAME,
                    Key=input_key,
                    Body=input_text.encode('utf-8'),
                    ContentType='text/plain'
                )
                s3_client.put_object(
                    Bucket=BUCKET_NAME,
                    Key=output_key,
                    Body=output_text.encode('utf-8'),
                    ContentType='text/plain'
                )
            except Exception as e:
                pass

            # 2. Put into DynamoDB TestCases table
            tc_item = {
                "ProblemID": pid,
                "TestCaseID": str(i),
                "S3InputKey": input_key,
                "S3OutputKey": output_key,
                "IsSample": (i <= 3),
                "Input": input_text,
                "Output": output_text,
                "InputPreview": input_text[:150],
                "OutputPreview": output_text[:150]
            }
            try:
                testcases_table.put_item(Item=tc_item)
                success_count += 1
            except Exception as e:
                print(f"  ❌ Error saving testcase {i} for {pid}: {e}")

        print(f"✅ Completed {success_count}/50 testcases for problem '{pid}'.")

if __name__ == "__main__":
    seed_problems()
    seed_testcases()
    print("\n🎉 ALL 10 LEETCODE PROBLEMS AND 500 TESTCASES SEEDED SUCCESSFULLY! 🎉")

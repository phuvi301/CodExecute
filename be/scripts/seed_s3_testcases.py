import os
import sys
import random
from pathlib import Path

# Thêm thư mục be vào sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(ROOT_DIR))

from botocore.exceptions import ClientError
from app.core.aws import s3_client, dynamodb_resource
from app.core.config import settings

BUCKET_NAME = settings.S3_TESTCASE_BUCKET
testcases_table = dynamodb_resource.Table(settings.DYNAMODB_TESTCASES_TABLE)

def ensure_bucket_exists():
    """Kiểm tra và tạo S3 Bucket nếu chưa tồn tại"""
    try:
        s3_client.head_bucket(Bucket=BUCKET_NAME)
        print(f"✅ S3 Bucket '{BUCKET_NAME}' đã tồn tại.")
    except ClientError as e:
        error_code = int(e.response['Error']['Code'])
        if error_code == 404 or e.response['Error']['Code'] == 'NoSuchBucket':
            print(f"⚡ Đang tạo S3 Bucket '{BUCKET_NAME}'...")
            try:
                if settings.AWS_REGION == "us-east-1":
                    s3_client.create_bucket(Bucket=BUCKET_NAME)
                else:
                    s3_client.create_bucket(
                        Bucket=BUCKET_NAME,
                        CreateBucketConfiguration={'LocationConstraint': settings.AWS_REGION}
                    )
                print(f"✅ Đã tạo S3 Bucket '{BUCKET_NAME}' thành công.")
            except Exception as create_err:
                print(f"❌ Lỗi khi tạo bucket: {create_err}")
        else:
            print(f"⚠️ Kiểm tra bucket gặp cảnh báo: {e}")

def generate_two_sum_testcase(tc_num: int):
    """Sinh ngẫu nhiên testcase hợp lệ cho bài toán Two Sum (Problem-1)"""
    if tc_num <= 5:
        n = random.randint(2, 10)
        nums = [random.randint(-20, 50) for _ in range(n)]
    elif tc_num <= 20:
        n = random.randint(20, 200)
        nums = [random.randint(-1000, 1000) for _ in range(n)]
    elif tc_num <= 40:
        n = random.randint(500, 2000)
        nums = [random.randint(-50000, 50000) for _ in range(n)]
    else:
        n = random.randint(3000, 8000)
        nums = [random.randint(-1000000, 1000000) for _ in range(n)]

    idx1 = random.randint(0, n - 2)
    idx2 = random.randint(idx1 + 1, n - 1)
    target = nums[idx1] + nums[idx2]

    input_text = f"{' '.join(map(str, nums))}\n{target}"
    output_text = f"{idx1} {idx2}"

    return input_text, output_text

def generate_add_two_numbers_testcase(tc_num: int):
    """Sinh testcase cho bài toán Add Two Numbers (Problem-2)"""
    len1 = random.randint(1, min(100, tc_num * 2))
    len2 = random.randint(1, min(100, tc_num * 2))
    
    l1 = [random.randint(1 if i == 0 else 0, 9) for i in range(len1)]
    l2 = [random.randint(1 if i == 0 else 0, 9) for i in range(len2)]
    
    num1 = int(''.join(map(str, reversed(l1))))
    num2 = int(''.join(map(str, reversed(l2))))
    total_sum = num1 + num2
    res_list = [int(c) for c in reversed(str(total_sum))]

    input_text = f"{' '.join(map(str, l1))}\n{' '.join(map(str, l2))}"
    output_text = f"{' '.join(map(str, res_list))}"
    
    return input_text, output_text

def upload_testcases_for_problem(problem_prefix: str, generator_fn, count: int = 60):
    """Tạo, upload S3 và lưu thông tin vị trí testcase vào DynamoDB Database"""
    print(f"\n🚀 Đang upload & lưu DB {count} testcases cho '{problem_prefix}'...")
    
    success_count = 0
    for i in range(1, count + 1):
        input_data, output_data = generator_fn(i)
        
        input_key = f"{problem_prefix}/input/{i}.txt"
        output_key = f"{problem_prefix}/output/{i}.txt"

        try:
            # 1. Upload Input & Output file lên S3
            s3_client.put_object(
                Bucket=BUCKET_NAME,
                Key=input_key,
                Body=input_data.encode('utf-8'),
                ContentType='text/plain'
            )
            s3_client.put_object(
                Bucket=BUCKET_NAME,
                Key=output_key,
                Body=output_data.encode('utf-8'),
                ContentType='text/plain'
            )

            # 2. Lưu thông tin vị trí testcase vào DynamoDB TestCases table
            item = {
                "ProblemID": problem_prefix,
                "TestCaseID": str(i),
                "S3InputKey": input_key,
                "S3OutputKey": output_key,
                "IsSample": (i <= 3),  # 3 testcase đầu tiên dùng cho nút Run Code (Sample)
                "InputPreview": input_data[:100],  # Preview ngắn để xem nhanh
                "OutputPreview": output_data[:100]
            }
            try:
                testcases_table.put_item(Item=item)
            except Exception as db_err:
                # Nếu DynamoDB chưa sẵn sàng thì bỏ qua lỗi DB, file S3 vẫn upload thành công
                pass

            success_count += 1
            if i % 10 == 0 or i == count:
                print(f"  └─ Upload S3 & Lưu DB thành công {i}/{count}: {input_key} và {output_key}")
        except Exception as e:
            print(f"  ❌ Lỗi khi upload/lưu DB testcase {i} cho {problem_prefix}: {e}")
            
    print(f"✅ Hoàn tất {success_count}/{count} testcase cho {problem_prefix}.")

def main():
    print("--- BẮT ĐẦU SEED TESTCASES LÊN S3 VÀ DYNAMODB ---")
    ensure_bucket_exists()

    problem_configs = [
        ("problem-1", generate_two_sum_testcase),
        ("problem-2", generate_add_two_numbers_testcase),
        ("two-sum", generate_two_sum_testcase),
        ("1", generate_two_sum_testcase),
    ]

    for prefix, gen_fn in problem_configs:
        upload_testcases_for_problem(problem_prefix=prefix, generator_fn=gen_fn, count=60)

    print("\n🎉 HOÀN TẤT TẤT CẢ SEED TESTCASES TRÊN S3 VÀ DATABASE DYNAMODB! 🎉")

if __name__ == '__main__':
    main()

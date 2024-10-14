import re
from datetime import datetime

from bbl_api.utils import print_blue, print_cyan

# from bbl_app.bbl_app.common.cp_qrcode import CpQrcode

customers = {
    'dena' :{"name": "东风德纳", "prefix": "X1250"},
    'hande': {"name": "陕汽汉德", "prefix": "652"},
    'zhongqi': {"name": "重汽", "prefix": "068"},
    'sanyi': {"name": "三一重工", "prefix": "SY"},
    'liuzhou_fangsheng': {"name": "柳州/苏州方盛", "prefix": "1710"},
    'hefei_fangsheng': {"name": "合肥方盛", "prefix": "7027"},
    'qingdao_haitong': {"name": "青岛海通", "prefix": "S0383"},
    # 'liuzhou_fangsheng': {"name": "方盛", "prefix": "171"}, # 条码上不能分出是柳州还是柳州方盛
    'bbl': {"name": "百兰车轴", "prefix": "BBL"},

    'other': {"name": "", "prefix": ""},
    
}
class CpQrcode:
    def __init__(self, qrcode_str):
        self.qrcode_str = qrcode_str
        self.decode_flag = False
        self.err_msg = None
        self.upload_bean = {}

    def split_date_str(self, date_str):
        if date_str.isdigit():
            return "20" + date_str[0:2] + "-" + date_str[2:4] + "-" + date_str[4:6]

    def is_dena(self):
        return self.qrcode_str.startswith("X1250")

    def is_hande(self):
        return self.qrcode_str.startswith("652")

    def is_zhongqi(self):
        return self.qrcode_str.startswith("068")
    


    def get_company(self):
        if self.is_bbl():
            return customers.get("bbl")['name']
        elif self.is_dena():
            return customers.get("dena")["name"]
        elif self.is_hande():
            return customers.get("hande")['name']
        elif self.is_zhongqi():
            return customers.get("zhongqi")['name']
        elif self.is_sanyi():
            return customers.get("sanyi")['name']
        elif self.is_liuzhou_fangsheng():
            return customers.get("liuzhou_fangsheng")['name']
        elif self.is_hefei_fangsheng():
            return customers.get("hefei_fangsheng")['name']
        elif self.is_qingdao_haitong():
            return customers.get("qingdao_haitong")['name']
        else:
            return '未知客户'


    def is_valid(self):
        return (
                self.is_bbl()
                or self.is_dena()
                or self.is_hande()
                or self.is_zhongqi()
                or self.is_sanyi()
                or self.is_liuzhou_fangsheng()
                or self.is_hefei_fangsheng()
                or self.is_qingdao_haitong()
                )
    
        
    def is_customer(self):
        return (
                self.is_dena()
                or self.is_hande()
                or self.is_zhongqi()
                or self.is_sanyi()
                or self.is_liuzhou_fangsheng()
                or self.is_hefei_fangsheng()
                or self.is_qingdao_haitong()
                )

    def validate_hande(self):
        if len(self.qrcode_str) != 18:
            self.err_msg += "/位数错误"
            return False

        s = re.search("652\\d*", self.qrcode_str)
        if not s or len(s.group(0)) != 18:
            self.err_msg += "/字母错误"
            return False

        date_str = self.split_date_str(self.qrcode_str[8:8+6])
        if not datetime.strptime(date_str, "%Y-%m-%d"):
            self.err_msg += "/日期错误"
            return False

        return True

    def validate_zhongqi(self):
        if len(self.qrcode_str) != 22:
            self.err_msg += "/位数错误"
            return False

        s = re.search("068\\d*", self.qrcode_str)
        if not s or len(s.group(0)) != 22:
            self.err_msg += "/字母错误"
            return False

        date_str = self.split_date_str(self.qrcode_str[10:10+6])
        if not datetime.strptime(date_str, "%Y-%m-%d"):
            self.err_msg += "/日期错误"
            return False

        return True

# =======================
    # x1250*3001011-kq01n***qz0022408160154*1**7awagafc

    def is_dena(self):
        return self.qrcode_str.upper().startswith("X1250")


    def validate_dena(self):
        # strs = self.qrcode_str.split("*")
        qrcode_upper = self.qrcode_str.upper()
        batch_code_match = re.search("QZ\\d*", qrcode_upper)
        if not batch_code_match or len(batch_code_match.group(0)) != 15:
            print("生产批次号错误")
            return False
        date_str = self.split_date_str(batch_code_match.group(0)[5:5+6])
        if not datetime.strptime(date_str, "%Y-%m-%d"):
            print("日期错误")
            return False

        return True

    def parse_dena(self):
        company = customers.get("dena")["name"]
        if not self.is_dena():
            self.err_msg = f"{company}:识别厂家失败"
            return self.upload_bean

        if not self.validate_dena():
            self.err_msg = f"{company}:二维码验证错误"
            return self.upload_bean
        
        strs = self.qrcode_str.split("*")
        strs = [str for str in strs if str != ""]
        print(strs)
        batch_code = re.search("(qz|QZ)\\d*", self.qrcode_str).group(0)
        print(batch_code)

        self.decode_flag = True
        self.upload_bean["company"] = company
        self.upload_bean["product_code"] = "C" + strs[1]
        self.upload_bean["drawing_id"] = "C" + strs[1]
        self.upload_bean["forge_batch"] = batch_code[0:11]
        self.upload_bean["code_date"] = self.split_date_str(batch_code[5:5+6])
        self.upload_bean["flow_id"] = batch_code[11:]
        self.upload_bean["cus_product_name"] = strs[1].split("-")[-1]
        return self.upload_bean

    def parse_hande(self):
        company = customers.get("hande")["name"]
        if not self.is_hande():
            self.err_msg = "*识别厂家失败"
            return False

        self.err_msg = company
        if not self.validate_hande():
            self.err_msg += "/*二维码验证错误"
            return False

        self.decode_flag = True
        self.err_msg += "/二维码验证成功"
        self.upload_bean["company"] = company
        self.upload_bean["product_code"] = self.qrcode_str[3:3+5]
        self.upload_bean["drawing_id"] = self.qrcode_str[3:3+5]
        self.upload_bean["forge_batch"] = self.qrcode_str[8:8+6]
        self.upload_bean["code_date"] = self.split_date_str(self.qrcode_str[8:8+6])
        self.upload_bean["flow_id"] = self.qrcode_str[14:]
        return self.upload_bean

    def parse_zhongqi(self):
        company = customers.get("zhongqi")["name"]
        if not self.is_zhongqi():
            self.err_msg = "*识别厂家失败"
            return False

        self.err_msg = company
        if not self.validate_zhongqi():
            self.err_msg += "/*二维码验证错误"
            return False

        self.decode_flag = True
        self.err_msg += "/二维码验证成功"
        self.upload_bean["company"] = company
        self.upload_bean["product_code"] = self.qrcode_str[3:3+6]
        self.upload_bean["drawing_id"] = self.qrcode_str[3:3+6]
        self.upload_bean["forge_batch"] = ""
        self.upload_bean["code_date"] = self.split_date_str(self.qrcode_str[10:10+6])
        self.upload_bean["flow_id"] = self.qrcode_str[17:17+4]
        return self.upload_bean

# =======================
    # SYC0087315724505432112010001
    # SYC008731572 物料编码
    # 450543 6位供应商编码
    # 211201 年月日
    # 0001 流水号
    def is_sanyi(self):
        return self.qrcode_str.startswith("SY")

    def parse_sanyi(self):
        if not self.is_sanyi():
            self.err_msg = "*识别厂家失败"
            return False

        company = customers.get("sanyi")["name"]
        self.err_msg = company
        # if not self.validate_zhongqi():
        #     self.err_msg += "/*二维码验证错误"
        #     return False

        self.decode_flag = True
        self.err_msg += "/二维码验证成功"
        self.upload_bean["company"] = company
        self.upload_bean["product_code"] = self.qrcode_str[-16:-10]
        self.upload_bean["drawing_id"] = self.qrcode_str[:-16]
        self.upload_bean["code_date"] = self.split_date_str(self.qrcode_str[-4-6:-4])
        self.upload_bean["flow_id"] = self.qrcode_str[-4:]
# =======================
    # 17102112018702408050044
    def is_liuzhou_fangsheng(self):
        return self.qrcode_str.startswith("1710")

    def parse_liuzhou_fangsheng(self):
        if not self.is_liuzhou_fangsheng():
            self.err_msg = "*识别厂家失败"
            return False

        company = customers.get("liuzhou_fangsheng")["name"]
        self.err_msg = company
        # if not self.validate_zhongqi():
        #     self.err_msg += "/*二维码验证错误"
        #     return False

        self.decode_flag = True
        self.err_msg += "/二维码验证成功"
        self.upload_bean["company"] = company
        self.upload_bean["product_code"] = self.qrcode_str[4:13]
        self.upload_bean["drawing_id"] = self.qrcode_str[4:13]
        self.upload_bean["code_date"] = self.split_date_str(self.qrcode_str[-4-6:-4])
        self.upload_bean["flow_id"] = self.qrcode_str[-4:]
# =======================
    # 70279112011751901120001
    def is_hefei_fangsheng(self):
        return self.qrcode_str.startswith("7027")

    def parse_hefei_fangsheng(self):
        if not self.is_hefei_fangsheng():
            self.err_msg = "*识别厂家失败"
            return False

        company = customers.get("hefei_fangsheng")["name"]
        self.err_msg = company
        # if not self.validate_zhongqi():
        #     self.err_msg += "/*二维码验证错误"
        #     return False

        self.decode_flag = True
        self.err_msg += "/二维码验证成功"
        self.upload_bean["company"] = company
        self.upload_bean["product_code"] = self.qrcode_str[4:13]
        self.upload_bean["drawing_id"] = self.qrcode_str[4:13]
        self.upload_bean["code_date"] = self.split_date_str(self.qrcode_str[-4-6:-4])
        self.upload_bean["flow_id"] = self.qrcode_str[-4:]
# =======================
    # 17102112018702408050044
    def is_qingdao_haitong(self):
        return self.qrcode_str.startswith(customers.get("qingdao_haitong")["prefix"])

    def parse_qingdao_haitong(self):
        if not self.is_qingdao_haitong():
            self.err_msg = "*识别厂家失败"
            return False

        company = customers.get("qingdao_haitong")["name"]
        self.err_msg = company
        # if not self.validate_zhongqi():
        #     self.err_msg += "/*二维码验证错误"
        #     return False

        self.decode_flag = True
        self.err_msg += "/二维码验证成功"
        self.upload_bean["company"] = company
        self.upload_bean["product_code"] = self.qrcode_str[5:15]
        self.upload_bean["drawing_id"] = self.qrcode_str[5:15]
        self.upload_bean["code_date"] = self.split_date_str(self.qrcode_str[15:21])
        self.upload_bean["flow_id"] = self.qrcode_str[21:]
# =======================
    def is_bbl(self):
        # ZQ0CT202407180013 or BBL*P3*C2312IY249*0005
        first5 = self.qrcode_str[0:5].upper()
        if first5.startswith("BBL"):
            return True
        # if len(self.qrcode_str) == 17 and self.qrcode_str[-12:-9] == '202':
        if self.qrcode_str[-12:-9] == '202':
            return True
        return False
    
    def parse_bbl(self):
        company = customers.get("bbl")["name"]
        if not self.is_bbl():
            self.err_msg = "*识别厂家失败"
            return False

        self.err_msg = company
        # if not self.validate_zhongqi():
        #     self.err_msg += "/*二维码验证错误"
        #     return False

        sep = '*'
        if not sep in self.qrcode_str:
            sep = '-'
        strs = self.qrcode_str.split(sep)
        if len(strs) < 4:
            # 兼容旧打印格式，无分割符 ZQ0CT202407180013
            self.upload_bean["product_code"] = self.qrcode_str[:-12]
            self.upload_bean["flow_id"] = self.qrcode_str[-4:]
        else:
            self.upload_bean["flow_id"] = strs[-1]
            self.upload_bean["product_code"] = strs[1]
            self.upload_bean["forge_batch"] = strs[2]
        self.decode_flag = True
        self.err_msg += "/二维码验证成功"
        self.upload_bean["company"] = company
        # return self.upload_bean

# ======================
    def parse_data(self):
        self.qrcode_str = self.qrcode_str.strip()
        self.decode_flag = False

        if self.is_dena():
            self.parse_dena()
        elif self.is_hande():
            self.parse_hande()
        elif self.is_zhongqi():
            self.parse_zhongqi()
        elif self.is_sanyi():
            self.parse_sanyi()
        elif self.is_liuzhou_fangsheng():
            self.parse_liuzhou_fangsheng()
        elif self.is_hefei_fangsheng():
            self.parse_hefei_fangsheng()
        elif self.is_qingdao_haitong():
            self.parse_qingdao_haitong()
        elif self.is_bbl():
            self.parse_bbl()
        else:
            self.err_msg = "*未识别到产品厂家"
            self.upload_bean["company"] = customers.get("other")["name"]

        return self.upload_bean


    def check(self):
        self.qrcode_str = self.qrcode_str.strip()
        if self.is_dena() or self.is_hande() or self.is_zhongqi():
            return True
        return False
    


def code_is_customer(code):
    return CpQrcode(code).is_customer()


def parse_bbl_forge_batch_no(forge_batch_no):
    # C2312IY249
    forge_info = {}
    # 材质代码
    forge_info["material_grade"] = forge_batch_no[0]
    forge_info["month"] = forge_batch_no[1:5]
    match = re.search(r'\d+$', forge_batch_no)
    product_line_start = 5
    product_line_end = 6
    if match:
        forge_info["heat_no_idx"] = match.group()
        product_line_end = match.start() - 1
    # 材料炉号代码，只打刻当年同规格材料炉号进厂顺序号
    forge_info["product_line"] = forge_batch_no[product_line_start:product_line_end]
    forge_info["material_supplier"] = forge_batch_no[product_line_end]
    return forge_info


if __name__ == "__main__":
    # s2 = 'C2312IY249'
    # t2 = parse_bbl_forge_batch_no(s2)
    print_cyan("test:")
    s1 = "BBL*P3*C2312IY249*0005"
    s1 = "BBL-P3-C2312IY249*1-0005"
    s1 = "SYC0087315724505432112010002"
    s1 = "SYC0087315724505432112010001"
    s1 = "17102112371632302120001"
    s1 = ""
    s1 = ""
    s1 = ""
    s1 = "70279112011751901120001"
    s1 = "UnboundLocalError: local variable 'bbl_code_info' referenced before assignment"
    s1 = "S038330100100852305280001"
    s1 = "0083202407240013"
    s1 = "BBL*30DS03-A*A2406IX131*0013"
    s1 = "x1250*3001011-kq01n***qz0022408160154*1**7awagafc"
    
    t1 = CpQrcode(s1)
    print_blue(t1.parse_data())

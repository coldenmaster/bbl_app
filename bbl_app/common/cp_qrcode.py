import re
from datetime import datetime

customers = {
    'dena' :{"name": "东风德纳", "prefix": "X1250"},
    'hande': {"name": "陕汽汉德", "prefix": "652"},
    'zhongqi': {"name": "重汽", "prefix": "068"},
    'sanyi': {"name": "三一", "prefix": "SANYI"},

    'other': {"name": "未知客户", "prefix": ""},
    
}
class CpQrcode:
    def __init__(self, qrcode_str):
        self.qrcode_str = qrcode_str
        self.decode_flag = False
        self.err_msg = None
        self.upload_bean = {}

    def split_date_str(self, date_str):
        return "20" + date_str[0:2] + "-" + date_str[2:4] + "-" + date_str[4:6]

    def is_dena(self):
        return self.qrcode_str.startswith("X1250")

    def is_hande(self):
        return self.qrcode_str.startswith("652")

    def is_zhongqi(self):
        return self.qrcode_str.startswith("068")

    def get_company(self):
        if self.is_dena():
            return customers.get("dena")["name"]
        elif self.is_hande():
            return customers.get("hande")['name']
        elif self.is_zhongqi():
            return customers.get("zhongqi")['name']
        # elif self.is_sanyi():
        #     return customers.get("sanyi")['name']
        else:
            return '未知客户'
        
    def validate_dena(self):
        strs = self.qrcode_str.split("*")
        batch_code_match = re.search("QZ\\d*", self.qrcode_str)

        if not batch_code_match or len(batch_code_match.group(0)) != 15:
            self.err_msg += "/生产批次号错误"
            return False

        date_str = self.split_date_str(batch_code_match.group(0)[5:5+6])
        if not datetime.strptime(date_str, "%Y-%m-%d"):
            self.err_msg += "/日期错误"
            return False

        return True

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

    def parse_dena(self):
        company = customers.get("dena")["name"]
        if not self.is_dena():
            self.err_msg = "*识别厂家失败"
            return False

        self.err_msg = company
        if not self.validate_dena():
            self.err_msg += "/*二维码验证错误"
            return False

        strs = self.qrcode_str.split("*")
        strs = [str for str in strs if str != ""]
        batch_code = re.search("QZ\\d*", self.qrcode_str).group(0)

        self.decode_flag = True
        self.err_msg += "/二维码验证成功"
        self.upload_bean["company"] = company
        self.upload_bean["product_code"] = "C" + strs[1]
        self.upload_bean["forge_batch"] = batch_code[0:11]
        self.upload_bean["code_date"] = self.split_date_str(batch_code[5:5+6])
        self.upload_bean["flow_id"] = batch_code[11:]
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
        self.upload_bean["forge_batch"] = ""
        self.upload_bean["code_date"] = self.split_date_str(self.qrcode_str[10:10+6])
        self.upload_bean["flow_id"] = self.qrcode_str[17:17+4]
        return self.upload_bean

    def parse_data(self):
        self.qrcode_str = self.qrcode_str.strip()
        self.decode_flag = False

        if self.is_dena():
            self.parse_dena()
        elif self.is_hande():
            self.parse_hande()
        elif self.is_zhongqi():
            self.parse_zhongqi()
        else:
            self.err_msg = "*未识别到产品厂家"
            self.upload_bean["company"] = customers.get("other")["name"]

        return self.upload_bean
    



    def check(self):
        self.qrcode_str = self.qrcode_str.strip()
        if self.is_dena() or self.is_hande() or self.is_zhongqi():
            return True
        return False

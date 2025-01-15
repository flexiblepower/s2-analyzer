from enum import Enum


class S2OriginType(Enum):
    RM = 'RM'
    CEM = 'CEM'

    def reverse(self):
        if self is S2OriginType.RM:
            return S2OriginType.CEM
        if self is S2OriginType.CEM:
            return S2OriginType.RM
        raise ValueError

    def is_rm(self):
        return self is S2OriginType.RM

    def is_cem(self):
        return self is S2OriginType.CEM
    
    def __str__(self):
        return self.value

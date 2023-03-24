from enum import Enum


class S2OriginType(Enum):
    RM = 'RM'  # TODO: Change this to RM, when a model is ready
    CEM = 'CEM'

    def reverse(self):
        if self is S2OriginType.RM:
            return S2OriginType.CEM
        elif self is S2OriginType.CEM:
            return S2OriginType.RM
        else:
            raise ValueError

    def isRM(self):
        return self is S2OriginType.RM

    def isCEM(self):
        return self is S2OriginType.CEM

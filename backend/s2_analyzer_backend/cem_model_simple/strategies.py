from collections import OrderedDict

from s2_analyzer_backend.cem_model_simple.common import ControlType
from s2_analyzer_backend.cem_model_simple.frbc_strategy import FRBCStrategy


# List of priority. Earlier in the list means higher preferences over later items in the list.
SUPPORTED_CONTROL_TYPES = OrderedDict([(ControlType.FRBC, FRBCStrategy),
                                       (ControlType.NoSelection, None),
                                       (ControlType.NoControl, None)])

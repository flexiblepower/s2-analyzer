from datetime import datetime, timedelta
from unittest import TestCase

from s2_analyzer_backend.cem_model_simple.frbc_strategy import FRBCStrategy
from s2_analyzer_backend.cem_model_simple.common import NumericalRange


class FRBCStrategyTest(TestCase):
    def test__get_expected_fill_level_at_end_of_timestep__correct(self):
        # Arrange
        fill_level_at_start_of_timestep = 85.0
        timestep_end = datetime(2009, 10, 12, 13, 45, 0, 0)
        fill_level_target_profile = {
            'message_type': 'FRBC.FillLevelTargetProfile',
            'message_id': 'm1',
            'start_time': (timestep_end - timedelta(seconds=10)).isoformat(),
            'elements': [{
                    'duration': 60,
                    'fill_level_range': {'start_of_range': 100, 'end_of_range': 100}
                }
            ]
        }

        # Act
        result_fill_level = FRBCStrategy.get_expected_fill_level_at_end_of_timestep(fill_level_at_start_of_timestep,
                                                                                    timestep_end,
                                                                                    fill_level_target_profile)

        # Assert
        expected_fill_level = NumericalRange(100, 100)
        self.assertEqual(result_fill_level, expected_fill_level)

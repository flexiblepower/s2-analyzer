from datetime import datetime, timedelta
from unittest import TestCase

from s2_analyzer_backend.envelope import Envelope
from s2_analyzer_backend.cem_model_simple.device_model import DeviceModel
from s2_analyzer_backend.cem_model_simple.frbc_strategy import FRBCStrategy
from s2_analyzer_backend.cem_model_simple.common import NumericalRange

import pytz


class FRBCStrategyTest(TestCase):
    def test__get_expected_fill_level_at_end_of_timestep__correct_100(self):
        # Arrange
        fill_level_at_start_of_timestep = 85.0
        timestep_end = datetime(2009, 10, 12, 13, 45, 0, 0, tzinfo=pytz.UTC)
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

    def test__get_expected_fill_level_at_end_of_timestep__correct_multiple_elements(self):
        # Arrange
        fill_level_at_start_of_timestep = 85.0
        timestep_end = datetime(2009, 10, 12, 13, 45, 0, 0, tzinfo=pytz.UTC)
        fill_level_target_profile = {
            'message_type': 'FRBC.FillLevelTargetProfile',
            'message_id': 'm1',
            'start_time': (timestep_end - timedelta(seconds=10)).isoformat(),
            'elements': [{
                    'duration': 60,
                    'fill_level_range': {'start_of_range': 100, 'end_of_range': 100}
                },
                {
                    'duration': 60,
                    'fill_level_range': {'start_of_range': 0,'end_of_range': 0}
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

    def test__get_expected_fill_level_at_end_of_timestep__correct_no_target_profile_elements(self):
        # Arrange
        fill_level_at_start_of_timestep = 85.0
        timestep_end = datetime(2009, 10, 12, 13, 45, 0, 0, tzinfo=pytz.UTC)
        fill_level_target_profile = {
            'message_type': 'FRBC.FillLevelTargetProfile',
            'message_id': 'm1',
            'start_time': (timestep_end - timedelta(seconds=70)).isoformat(),
            'elements': []
        }

        # Act
        result_fill_level = FRBCStrategy.get_expected_fill_level_at_end_of_timestep(fill_level_at_start_of_timestep,
                                                                                    timestep_end,
                                                                                    fill_level_target_profile)

        # Assert
        expected_fill_level = NumericalRange(85.0, 85.0)
        self.assertEqual(result_fill_level, expected_fill_level)

    def test__get_expected_fill_level_at_end_of_timestep__correct_target_profile_expired(self):
        # Arrange
        fill_level_at_start_of_timestep = 85.0
        timestep_end = datetime(2009, 10, 12, 13, 45, 0, 0, tzinfo=pytz.UTC)
        fill_level_target_profile = {
            'message_type': 'FRBC.FillLevelTargetProfile',
            'message_id': 'm1',
            'start_time': (timestep_end - timedelta(seconds=130)).isoformat(),
            'elements': [{
                    'duration': 60,
                    'fill_level_range': {'start_of_range': 100, 'end_of_range': 100}
                },
                {
                    'duration': 60,
                    'fill_level_range': {'start_of_range': 0, 'end_of_range': 10}
                }
            ]
        }

        # Act
        result_fill_level = FRBCStrategy.get_expected_fill_level_at_end_of_timestep(fill_level_at_start_of_timestep,
                                                                                    timestep_end,
                                                                                    fill_level_target_profile)

        # Assert
        expected_fill_level = NumericalRange(85.0, 85.0)
        self.assertEqual(result_fill_level, expected_fill_level)

    def test__get_expected_fill_level_at_end_of_timestep__correct_2nd_element(self):
        # Arrange
        fill_level_at_start_of_timestep = 85.0
        timestep_end = datetime(2009, 10, 12, 13, 45, 0, 0, tzinfo=pytz.UTC)
        fill_level_target_profile = {
            'message_type': 'FRBC.FillLevelTargetProfile',
            'message_id': 'm1',
            'start_time': (timestep_end - timedelta(seconds=70)).isoformat(),
            'elements': [{
                    'duration': 60,
                    'fill_level_range': {'start_of_range': 100, 'end_of_range': 100}
                },
                {
                    'duration': 60,
                    'fill_level_range': {'start_of_range': 0, 'end_of_range': 10}
                }
            ]
        }

        # Act
        result_fill_level = FRBCStrategy.get_expected_fill_level_at_end_of_timestep(fill_level_at_start_of_timestep,
                                                                                    timestep_end,
                                                                                    fill_level_target_profile)

        # Assert
        expected_fill_level = NumericalRange(0, 10)
        self.assertEqual(result_fill_level, expected_fill_level)

    def test__get_fill_rate_for_operation_mode_element__correct_positives(self):
        # Arrange
        om_element = {
            'fill_level_range': {
                'start_of_range': 20,
                'end_of_range': 30
            },
            'fill_rate': {
                'start_of_range': 5,
                'end_of_range': 8
            },
            'power_ranges': [{
                    'start_of_range': '20000',
                    'end_of_range': '30000',
                    'commodity_quantity': 'ELECTRIC.POWER.L1'
                }
            ]
        }
        om_factor = 0.4

        # Act
        result_fill_rate = FRBCStrategy.get_fill_rate_for_operation_mode_element(om_element,
                                                                                 om_factor)

        # Assert
        expected_fill_rate = 6.2
        self.assertEqual(result_fill_rate, expected_fill_rate)

    def test__get_fill_rate_for_operation_mode_element__correct_positive_and_negative(self):
        # Arrange
        om_element = {
            'fill_level_range': {
                'start_of_range': 20,
                'end_of_range': 30
            },
            'fill_rate': {
                'start_of_range': -5,
                'end_of_range': 8
            },
            'power_ranges': [{
                    'start_of_range': '20000',
                    'end_of_range': '30000',
                    'commodity_quantity': 'ELECTRIC.POWER.L1'
                }
            ]
        }
        om_factor = 0.4

        # Act
        result_fill_rate = FRBCStrategy.get_fill_rate_for_operation_mode_element(om_element,
                                                                                 om_factor)

        # Assert
        expected_fill_rate = 0.2
        self.assertAlmostEqual(result_fill_rate, expected_fill_rate, delta=0.001)

    def test__get_reachable_operation_modes_for_actuator__correct_from_discharge(self):
        # Arrange
        actuator_status = {
            'message_type': 'FRBC.ActuatorStatus',
            'message_id': 'm6',
            'actuator_id': 'actuator1',
            'active_operation_mode_id': 'om0',
            'operation_mode_factor': 0.5
        }

        actuator_description = {
                'id': 'actuator1',
                'diagnostic_label': 'charge_discharge_idle',
                'supported_commodities': ['ELECTRICITY'],
                'operation_modes': [
                    {
                        'id': 'om0',
                        'diagnostic_label': 'discharge',
                        'elements': [{
                            'fill_level_range': {'start_of_range': 0, 'end_of_range': 100},
                            'fill_rate': {'start_of_range': 0, 'end_of_range': -5.33},
                            'power_ranges': [{
                                'start_of_range': 0,
                                'end_of_range': -80_000,
                                'commodity_quantity': 'ELECTRIC.POWER.L1'
                            }],
                        }],
                        'abnormal_condition_only': False,
                    },
                    {
                        'id': 'om1',
                        'diagnostic_label': 'charge',
                        'elements': [{
                            'fill_level_range': {
                                'start_of_range': 0,
                                'end_of_range': 100
                            },
                            'fill_rate': {
                                'start_of_range': 0,
                                'end_of_range': 5.33
                            },
                            'power_ranges': [{
                                'start_of_range': 0,
                                'end_of_range': 80_000,
                                'commodity_quantity': 'ELECTRIC.POWER.L1'
                            }],
                        }],
                        'abnormal_condition_only': False,
                    },
                    {
                        'id': 'om2',
                        'diagnostic_label': 'idle',
                        'elements': [{
                            'fill_level_range': {
                                'start_of_range': 0,
                                'end_of_range': 100
                            },
                            'fill_rate': {
                                'start_of_range': 0,
                                'end_of_range': 0
                            },
                            'power_ranges': [{
                                'start_of_range': 0,
                                'end_of_range': 0,
                                'commodity_quantity': 'ELECTRIC.POWER.L1'
                            }],
                        }],
                        'abnormal_condition_only': False,
                    }
                ],
                'transitions': [{
                    'id': 't1',
                    'from': 'om0',
                    'to': 'om2',
                    'start_timers': [],
                    'blocking_timers': [],
                    'abnormal_condition_only': False
                }, {
                    'id': 't2',
                    'from': 'om2',
                    'to': 'om0',
                    'start_timers': [],
                    'blocking_timers': [],
                    'abnormal_condition_only': False
                }, {
                    'id': 't3',
                    'from': 'om2',
                    'to': 'om1',
                    'start_timers': [],
                    'blocking_timers': [],
                    'abnormal_condition_only': False
                }, {
                    'id': 't1',
                    'from': 'om1',
                    'to': 'om2',
                    'start_timers': [],
                    'blocking_timers': [],
                    'abnormal_condition_only': False
                }],
                'timers': []
            }

        # Act
        reachable_oms = FRBCStrategy.get_reachable_operation_modes_for_actuator(actuator_status,
                                                                                actuator_description)

        # Assert
        expected_reachable_oms = [{
            'id': 'om0',
            'diagnostic_label': 'discharge',
            'elements': [{
                'fill_level_range': {'start_of_range': 0, 'end_of_range': 100},
                'fill_rate': {'start_of_range': 0, 'end_of_range': -5.33},
                'power_ranges': [{
                    'start_of_range': 0,
                    'end_of_range': -80_000,
                    'commodity_quantity': 'ELECTRIC.POWER.L1'
                }],
            }],
            'abnormal_condition_only': False,
        }, {
            'id': 'om2',
            'diagnostic_label': 'idle',
            'elements': [{
                'fill_level_range': {
                    'start_of_range': 0,
                    'end_of_range': 100
                },
                'fill_rate': {
                    'start_of_range': 0,
                    'end_of_range': 0
                },
                'power_ranges': [{
                    'start_of_range': 0,
                    'end_of_range': 0,
                    'commodity_quantity': 'ELECTRIC.POWER.L1'
                }],
            }],
            'abnormal_condition_only': False,
        }]
        self.assertEqual(reachable_oms, expected_reachable_oms)

    def test__get_reachable_operation_modes_for_actuator__correct_from_idle(self):
        # Arrange
        actuator_status = {
            'message_type': 'FRBC.ActuatorStatus',
            'message_id': 'm6',
            'actuator_id': 'actuator1',
            'active_operation_mode_id': 'om2',
            'operation_mode_factor': 0.5
        }

        actuator_description = {
                'id': 'actuator1',
                'diagnostic_label': 'charge_discharge_idle',
                'supported_commodities': ['ELECTRICITY'],
                'operation_modes': [
                    {
                        'id': 'om0',
                        'diagnostic_label': 'discharge',
                        'elements': [{
                            'fill_level_range': {'start_of_range': 0, 'end_of_range': 100},
                            'fill_rate': {'start_of_range': 0, 'end_of_range': -5.33},
                            'power_ranges': [{
                                'start_of_range': 0,
                                'end_of_range': -80_000,
                                'commodity_quantity': 'ELECTRIC.POWER.L1'
                            }],
                        }],
                        'abnormal_condition_only': False,
                    },
                    {
                        'id': 'om1',
                        'diagnostic_label': 'charge',
                        'elements': [{
                            'fill_level_range': {
                                'start_of_range': 0,
                                'end_of_range': 100
                            },
                            'fill_rate': {
                                'start_of_range': 0,
                                'end_of_range': 5.33
                            },
                            'power_ranges': [{
                                'start_of_range': 0,
                                'end_of_range': 80_000,
                                'commodity_quantity': 'ELECTRIC.POWER.L1'
                            }],
                        }],
                        'abnormal_condition_only': False,
                    },
                    {
                        'id': 'om2',
                        'diagnostic_label': 'idle',
                        'elements': [{
                            'fill_level_range': {
                                'start_of_range': 0,
                                'end_of_range': 100
                            },
                            'fill_rate': {
                                'start_of_range': 0,
                                'end_of_range': 0
                            },
                            'power_ranges': [{
                                'start_of_range': 0,
                                'end_of_range': 0,
                                'commodity_quantity': 'ELECTRIC.POWER.L1'
                            }],
                        }],
                        'abnormal_condition_only': False,
                    }
                ],
                'transitions': [{
                    'id': 't1',
                    'from': 'om0',
                    'to': 'om2',
                    'start_timers': [],
                    'blocking_timers': [],
                    'abnormal_condition_only': False
                }, {
                    'id': 't2',
                    'from': 'om2',
                    'to': 'om0',
                    'start_timers': [],
                    'blocking_timers': [],
                    'abnormal_condition_only': False
                }, {
                    'id': 't3',
                    'from': 'om2',
                    'to': 'om1',
                    'start_timers': [],
                    'blocking_timers': [],
                    'abnormal_condition_only': False
                }, {
                    'id': 't1',
                    'from': 'om1',
                    'to': 'om2',
                    'start_timers': [],
                    'blocking_timers': [],
                    'abnormal_condition_only': False
                }],
                'timers': []
            }

        # Act
        reachable_oms = FRBCStrategy.get_reachable_operation_modes_for_actuator(actuator_status,
                                                                                actuator_description)

        # Assert
        expected_reachable_oms = [
            {
                'id': 'om0',
                'diagnostic_label': 'discharge',
                'elements': [{
                    'fill_level_range': {
                        'start_of_range': 0,
                        'end_of_range': 100
                    },
                    'fill_rate': {
                        'start_of_range': 0,
                        'end_of_range': -5.33
                    },
                    'power_ranges': [{
                        'start_of_range': 0,
                        'end_of_range': -80_000,
                        'commodity_quantity': 'ELECTRIC.POWER.L1'
                    }],
                }],
                'abnormal_condition_only': False,
            },
            {
                'id': 'om1',
                'diagnostic_label': 'charge',
                'elements': [{
                    'fill_level_range': {
                        'start_of_range': 0,
                        'end_of_range': 100
                    },
                    'fill_rate': {
                        'start_of_range': 0,
                        'end_of_range': 5.33
                    },
                    'power_ranges': [{
                        'start_of_range': 0,
                        'end_of_range': 80_000,
                        'commodity_quantity': 'ELECTRIC.POWER.L1'
                    }],
                }],
                'abnormal_condition_only': False,
            },
            {
                'id': 'om2',
                'diagnostic_label': 'idle',
                'elements': [{
                    'fill_level_range': {
                        'start_of_range': 0,
                        'end_of_range': 100
                    },
                    'fill_rate': {
                        'start_of_range': 0,
                        'end_of_range': 0
                    },
                    'power_ranges': [{
                        'start_of_range': 0,
                        'end_of_range': 0,
                        'commodity_quantity': 'ELECTRIC.POWER.L1'
                    }],
                }],
                'abnormal_condition_only': False,
            }
        ]

        self.assertEqual(sorted(reachable_oms, key=lambda om: om['id']),
                         sorted(expected_reachable_oms, key=lambda om: om['id']))

    def test__choose_operation_modes_to_reach_fill_level_target__correct_single_om(self):
        # Arrange
        s2_device_model = DeviceModel('some-device', None, None, None)
        frbc_strategy = FRBCStrategy(s2_device_model, None)

        current_fill_level = 85
        actuate_fill_level = -5
        duration = timedelta(seconds=60)

        system_description = {
            'message_type': 'FRBC.SystemDescription',
            'message_id': 'm8',
            'valid_from': datetime.now(tz=pytz.UTC).isoformat(),
            'actuators': [{
                'id': 'actuator1',
                'diagnostic_label': 'charge_discharge_idle',
                'supported_commodities': ['ELECTRICITY'],
                'operation_modes': [
                    {
                        'id': 'om0',
                        'diagnostic_label': 'charge_discharge_idle',
                        'elements': [{
                            'fill_level_range': {'start_of_range': 0, 'end_of_range': 100},
                            'fill_rate': {'start_of_range': -5.33, 'end_of_range': 5.33},
                            'power_ranges': [{
                                'start_of_range': -80_000,
                                'end_of_range': 80_000,
                                'commodity_quantity': 'ELECTRIC.POWER.L1'
                            }],
                        }],
                        'abnormal_condition_only': False,
                    }
                ],
                'transitions': [],
                'timers': []
            }],
            'storage': {
                'diagnostic_label': 'electrical battery',
                'fill_level_label': 'SoC %',
                'provides_leakage_behaviour': False,
                'provides_fill_level_target_profile': False,
                'provides_usage_forecast': False,
                'fill_level_range': {'start_of_range': 0, 'end_of_range': 100}
            }
        }

        actuator_status = Envelope(None, None, 'FRBC.ActuatorStatus', {
            'message_type': 'FRBC.ActuatorStatus',
            'message_id': 'm6',
            'actuator_id': 'actuator1',
            'active_operation_mode_id': 'om0',
            'operation_mode_factor': 0.5
        })

        # Act
        frbc_strategy.handle_actuator_status(actuator_status)
        best_combination = frbc_strategy.choose_operation_modes_to_reach_fill_level_target(current_fill_level,
                                                                                           actuate_fill_level,
                                                                                           system_description,
                                                                                           duration)

        # Assert
        expected_best_combination = [({
            'diagnostic_label': 'charge_discharge_idle',
            'id': 'actuator1',
            'operation_modes': [{'abnormal_condition_only': False,
                                'diagnostic_label': 'charge_discharge_idle',
                                'elements': [{'fill_level_range': {'end_of_range': 100,
                                                                   'start_of_range': 0},
                                              'fill_rate': {'end_of_range': 5.33,
                                                            'start_of_range': -5.33},
                                              'power_ranges': [{'commodity_quantity': 'ELECTRIC.POWER.L1',
                                                                'end_of_range': 80000,
                                                                'start_of_range': -80000}]}],
                                'id': 'om0'}],
            'supported_commodities': ['ELECTRICITY'],
            'timers': [],
            'transitions': []
        }, {
            'abnormal_condition_only': False,
            'diagnostic_label': 'charge_discharge_idle',
            'elements': [{'fill_level_range': {'end_of_range': 100, 'start_of_range': 0},
                         'fill_rate': {'end_of_range': 5.33, 'start_of_range': -5.33},
                         'power_ranges': [{'commodity_quantity': 'ELECTRIC.POWER.L1',
                                           'end_of_range': 80000,
                                           'start_of_range': -80000}]}],
            'id': 'om0'
        }, 0.492)]

        self.assertEqual(best_combination, expected_best_combination)

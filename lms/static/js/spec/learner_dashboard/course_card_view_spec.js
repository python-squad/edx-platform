define([
    'backbone',
    'jquery',
    'js/learner_dashboard/models/course_card_model',
    'js/learner_dashboard/views/course_card_view'
], function(Backbone, $, CourseCardModel, CourseCardView) {
    'use strict';

    describe('Course Card View', function() {
        var view = null,
            courseCardModel,
            course,
            startDate = 'Feb 28, 2017',
            endDate = 'May 30, 2017',

            setupView = function(data, isEnrolled, collectionCourseStatus) {
                var programData = $.extend({}, data),
                    context = {
                        courseData: {
                            grades: {
                                'course-v1:WageningenX+FFESx+1T2017': 0.8
                            }
                        },
                        enrolled: isEnrolled,
                        collectionCourseStatus: collectionCourseStatus
                    };

                if (typeof collectionCourseStatus === 'undefined') {
                    context.collectionCourseStatus = 'completed';
                }

                programData.course_runs[0].is_enrolled = isEnrolled;
                setFixtures('<div class="program-course-card"></div>');
                courseCardModel = new CourseCardModel(programData);
                view = new CourseCardView({
                    model: courseCardModel,
                    context: context
                });
            },

            validateCourseInfoDisplay = function() {
                // DRY validation for course card in enrolled state
                expect(view.$('.course-details .course-title-link').text().trim()).toEqual(course.title);
                expect(view.$('.course-details .course-title-link').attr('href')).toEqual(
                    course.course_runs[0].marketing_url
                );
                expect(view.$('.course-details .course-text .run-period').html()).toEqual(
                    startDate + ' - ' + endDate
                );
            };

        beforeEach(function() {
            // NOTE: This data is redefined prior to each test case so that tests
            // can't break each other by modifying data copied by reference.
            course = {
                key: 'WageningenX+FFESx',
                uuid: '9f8562eb-f99b-45c7-b437-799fd0c15b6a',
                title: 'Systems thinking and environmental sustainability',
                course_runs: [
                    {
                        key: 'course-v1:WageningenX+FFESx+1T2017',
                        title: 'Food Security and Sustainability: Systems thinking and environmental sustainability',
                        image: {
                            src: 'https://example.com/9f8562eb-f99b-45c7-b437-799fd0c15b6a.jpg'
                        },
                        marketing_url: 'https://www.edx.org/course/food-security-sustainability',
                        start: '2017-02-28T05:00:00Z',
                        end: '2017-05-30T23:00:00Z',
                        enrollment_start: '2017-01-18T00:00:00Z',
                        enrollment_end: null,
                        type: 'verified',
                        certificate_url: '',
                        course_url: 'https://courses.example.com/courses/course-v1:WageningenX+FFESx+1T2017',
                        enrollment_open_date: 'Jan 18, 2016',
                        is_course_ended: false,
                        is_enrolled: true,
                        is_enrollment_open: true,
                        status: 'published',
                        upgrade_url: ''
                    }
                ]
            };

            setupView(course, true);
        });

        afterEach(function() {
            view.remove();
        });

        it('should exist', function() {
            expect(view).toBeDefined();
        });

        it('should render final grade if course is completed', function() {
            view.remove();
            setupView(course, true);
            expect(view.$('.grade-display').text()).toEqual('80%');
        });

        it('should not render final grade if course has not been completed', function() {
            view.remove();
            setupView(course, true, 'in_progress');
            expect(view.$('.final-grade').length).toEqual(0);
        });

        it('should render the course card based on the data not enrolled', function() {
            view.remove();
            setupView(course, false);
            validateCourseInfoDisplay();
        });

        it('should show the course advertised start date', function() {
            var advertisedStart = 'A long time ago...';
            course.course_runs[0].advertised_start = advertisedStart;

            setupView(course, false);

            expect(view.$('.course-details .course-text .run-period').html()).toEqual(
                advertisedStart + ' - ' + endDate
            );
        });

        it('should only show certificate status section if a certificate has been earned', function() {
            var certUrl = 'sample-certificate';

            expect(view.$('.course-certificate .certificate-status').length).toEqual(0);
            view.remove();

            course.course_runs[0].certificate_url = certUrl;
            setupView(course, false);
            expect(view.$('.course-certificate .certificate-status').length).toEqual(1);
        });

        it('should only show upgrade message section if an upgrade is required', function() {
            var upgradeUrl = '/path/to/upgrade';

            expect(view.$('.upgrade-message').length).toEqual(0);
            view.remove();

            course.course_runs[0].upgrade_url = upgradeUrl;
            setupView(course, false);
            expect(view.$('.upgrade-message').length).toEqual(1);
            expect(view.$('.upgrade-message .cta-primary').attr('href')).toEqual(upgradeUrl);
        });

        it('should not show both the upgrade message and certificate status sections', function() {
            // Verify that no empty elements are left in the DOM.
            course.course_runs[0].upgrade_url = '';
            course.course_runs[0].certificate_url = '';
            setupView(course, false);
            expect(view.$('.upgrade-message').length).toEqual(0);
            expect(view.$('.course-certificate .certificate-status').length).toEqual(0);
            view.remove();

            // Verify that the upgrade message takes priority.
            course.course_runs[0].upgrade_url = '/path/to/upgrade';
            course.course_runs[0].certificate_url = '/path/to/certificate';
            setupView(course, false);
            expect(view.$('.upgrade-message').length).toEqual(1);
            expect(view.$('.course-certificate .certificate-status').length).toEqual(0);
        });

        it('should allow enrollment in future runs when the user has an expired enrollment', function() {
            var newRun = $.extend({}, course.course_runs[0]),
                newRunKey = 'course-v1:foo+bar+baz',
                advertisedStart = 'Summer';

            newRun.key = newRunKey;
            newRun.is_enrolled = false;
            newRun.advertised_start = advertisedStart;
            course.course_runs.push(newRun);

            course.expired = true;

            setupView(course, true);

            expect(courseCardModel.get('course_run_key')).toEqual(newRunKey);
            expect(view.$('.course-details .course-text .run-period').html()).toEqual(
                advertisedStart + ' - ' + endDate
            );
        });

        it('should show a message if an there is an upcoming course run', function() {
            course.course_runs[0].is_enrollment_open = false;

            setupView(course, false);

            expect(view.$('.course-details .course-title').text().trim()).toEqual(course.title);
            expect(view.$('.course-details .course-text .run-period').length).toBe(0);
            expect(view.$('.no-action-message').text().trim()).toBe('Coming Soon');
            expect(view.$('.enrollment-open-date').text().trim()).toEqual(
                course.course_runs[0].enrollment_open_date
            );
        });

        it('should show a message if there are no upcoming course runs', function() {
            course.course_runs[0].is_enrollment_open = false;
            course.course_runs[0].is_course_ended = true;

            setupView(course, false);

            expect(view.$('.course-details .course-title').text().trim()).toEqual(course.title);
            expect(view.$('.course-details .course-text .run-period').length).toBe(0);
            expect(view.$('.no-action-message').text().trim()).toBe('Not Currently Available');
            expect(view.$('.enrollment-opens').length).toEqual(0);
        });

        it('should link to the marketing site when the user is not enrolled', function() {
            setupView(course, false);
            expect(view.$('.course-title-link').attr('href')).toEqual(course.course_runs[0].marketing_url);
        });

        it('should link to the course home when the user is enrolled', function() {
            setupView(course, true);
            expect(view.$('.course-title-link').attr('href')).toEqual(course.course_runs[0].course_url);
        });

        it('should not link to the marketing site if the URL is not available', function() {
            course.course_runs[0].marketing_url = null;
            setupView(course, false);

            expect(view.$('.course-title-link').length).toEqual(0);
        });

        it('should not link to the course home if the URL is not available', function() {
            course.course_runs[0].course_url = null;
            setupView(course, true);

            expect(view.$('.course-title-link').length).toEqual(0);
        });

        it('should show an unfulfilled user entitlement allows you to select a session', function() {
            course.user_entitlement = {
                uuid: '99fc7414c36d4f56b37e8e30acf4c7ba',
                course_uuid: '99fc7414c36d4f56b37e8e30acf4c7ba',
                expiration_date: '2017-12-05 01:06:12'
            };
            setupView(course, false);
            expect(view.$('.info-expires-at').text().trim()).toContain('You must select a session by');
        });

        it('should show a fulfilled expired user entitlement does not allow the changing of sessions', function() {
            course.user_entitlement = {
                uuid: '99fc7414c36d4f56b37e8e30acf4c7ba',
                course_uuid: '99fc7414c36d4f56b37e8e30acf4c7ba',
                expired_at: '2017-12-06 01:06:12',
                expiration_date: '2017-12-05 01:06:12'
            };
            setupView(course, true);
            expect(view.$('.info-expires-at').text().trim()).toContain('You can no longer change sessions.');
        });

        it('should show a fulfilled user entitlement allows the changing of sessions', function() {
            course.user_entitlement = {
                uuid: '99fc7414c36d4f56b37e8e30acf4c7ba',
                course_uuid: '99fc7414c36d4f56b37e8e30acf4c7ba',
                expiration_date: '2017-12-05 01:06:12'
            };
            setupView(course, true);
            expect(view.$('.info-expires-at').text().trim()).toContain('You can change sessions until');
        });
    });
}
);

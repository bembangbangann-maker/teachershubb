import React from 'react';
import Header from './Header';
import { HeartIcon, MailIcon, MessageSquareIcon } from './icons';

const About: React.FC = () => {
    return (
        <div className="min-h-screen">
            <Header title="About The Teacher's Hub" />
            <div className="p-8">
                <div className="max-w-4xl mx-auto bg-base-200 p-8 rounded-xl shadow-lg">
                    <div className="text-center mb-8">
                        <HeartIcon className="w-16 h-16 mx-auto text-primary mb-4" />
                        <h2 className="text-3xl font-bold text-base-content">
                            Built by a Teacher, for Teachers
                        </h2>
                    </div>
                    <div className="text-lg text-base-content/90 leading-relaxed space-y-6">
                        <p>
                            As a fellow teacher, I understand the immense dedication and hard work that goes into educating our future generations. I also know the overwhelming burden of administrative tasks that often pulls us away from our true passion: teaching.
                        </p>
                        <p>
                            That's why I created <strong className="text-primary">The Teacher's Hub</strong>. This application was born from a simple idea: to build a secure, all-in-one tool that automates and centralizes the essential but time-consuming administrative work we face every day.
                        </p>
                        <p>
                            From managing class rosters and tracking attendance to calculating grades, generating official forms, and creating certificates, my goal is to give you back your valuable time. Time that can be better spent inspiring students, preparing engaging lessons, and making a real difference in the classroom.
                        </p>
                        <p>
                            This project is a labor of love, designed with the real-world needs of a public school teacher in mind. It's built to be secure, with all your data stored locally on your own device, ensuring the privacy of you and your students.
                        </p>
                        <p>
                            Thank you for using The Teacher's Hub. I hope it makes your life just a little bit easier.
                        </p>
                    </div>

                    <div className="mt-10 pt-6 border-t border-base-300 text-center">
                        <h3 className="text-2xl font-bold text-base-content mb-4">
                            Questions, Feedback, or Suggestions?
                        </h3>
                        <p className="text-base-content/80 mb-6">
                            Your input is valuable! Feel free to reach out.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                            <a
                                href="mailto:randydgancheta22@gmail.com"
                                className="flex items-center justify-center gap-3 w-full sm:w-auto bg-primary hover:bg-primary-focus text-white font-bold py-3 px-6 rounded-lg transition-colors"
                            >
                                <MailIcon className="w-5 h-5" />
                                <span>Email Me</span>
                            </a>
                            <a
                                href="https://m.me/ramdy0922"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-3 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                            >
                                <MessageSquareIcon className="w-5 h-5" />
                                <span>Message on Messenger</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;

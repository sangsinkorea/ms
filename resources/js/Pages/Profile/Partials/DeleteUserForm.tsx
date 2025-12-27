import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';

export default function DeleteUserForm({
    className = '',
}: {
    className?: string;
}) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser: FormEventHandler = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    계정 삭제
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    계정이 삭제되면 모든 리소스와 데이터가 영구적으로 삭제됩니다. 계정을 삭제하기 전에 보관하고 싶은 데이터나 정보를 다운로드하세요.
                </p>
            </header>

            <DangerButton onClick={confirmUserDeletion}>
                계정 삭제
            </DangerButton>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">
                        정말로 계정을 삭제하시겠습니까?
                    </h2>

                    <p className="mt-1 text-sm text-gray-600">
                        계정이 삭제되면 모든 리소스와 데이터가 영구적으로 삭제됩니다. 계정을 영구적으로 삭제하려면 비밀번호를 입력하세요.
                    </p>

                    <div className="mt-6">
                        <InputLabel
                            htmlFor="password"
                            value="비밀번호"
                            className="sr-only"
                        />

                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            className="mt-1 block w-3/4"
                            isFocused
                            placeholder="비밀번호"
                        />

                        <InputError
                            message={errors.password}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={closeModal}>
                            취소
                        </SecondaryButton>

                        <DangerButton className="ms-3" disabled={processing}>
                            계정 삭제
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </section>
    );
}

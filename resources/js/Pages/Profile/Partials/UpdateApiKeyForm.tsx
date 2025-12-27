import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Transition } from '@headlessui/react';

export default function UpdateApiKeyForm({
    className = '',
}: {
    className?: string;
}) {
    // Current User to check if key exists (optional logic)
    const user = usePage().props.auth.user;

    // We don't send the current key to front-end for security, usually. 
    // Or we can send a masked version. The user model casts it to encrypted, so extracting it effectively here:
    // Actually, for security, standard practice is: leave blank to keep unchanged. 
    // But user wants to PUT it.

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            google_api_key: '',
        });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch(route('profile.api-key'), {
            preserveScroll: true,
            onSuccess: () => {
                setData('google_api_key', '');
            },
        });
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    Google API Key 설정
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    AI 분석 기능을 사용하기 위한 Google Gemini API Key를 저장합니다.
                    <br />
                    키는 암호화되어 안전하게 저장됩니다.
                    {user.has_api_key ? (
                        <span className="ml-2 font-bold text-green-600">✅ 현재 등록된 API 키가 있습니다.</span>
                    ) : (
                        <span className="ml-2 font-bold text-red-500">❌ 등록된 API 키가 없습니다.</span>
                    )}
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="google_api_key" value="Google API Key" />

                    <TextInput
                        id="google_api_key"
                        value={data.google_api_key}
                        onChange={(e) => setData('google_api_key', e.target.value)}
                        type="password"
                        className="mt-1 block w-full"
                        placeholder="새로운 키를 입력하세요 (변경하지 않으려면 비워두세요)"
                    />

                    <InputError message={errors.google_api_key} className="mt-2" />
                </div>

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>저장</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition ease-in-out"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">저장되었습니다.</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
